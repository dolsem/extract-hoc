function extractArguments({ types, path, forDefaultExport }, node) {
  if (node.type !== 'CallExpression') {
    return;
  }

  node.arguments = node.arguments.map(node => {
    if (types.isCallExpression(node)) {
      extractArguments({ types, path, forDefaultExport }, node);
    }

    if (types.isIdentifier(node)) {
      return node;
    }

    if (types.isLiteral(node)) {
      return node;
    }

    if (types.isSpreadElement(node)) {
      return node;
    }

    const idName = forDefaultExport ? 'default' : path.node.id.name;
    const id = path.scope.generateUidIdentifier(`${idName}_arg`);

    path.insertBefore(
      types.assignmentExpression('=', id, node)
    );

    path.scope.push({ id });

    return id;
  });
}

function pathToInsertAssignments(path) {
  while (path.parent.type !== 'Program') {
    path = path.parentPath;
  }

  return path;
}

module.exports = function({ types }) {
  const Visitor = {
    VariableDeclarator(path) {
      if (
        path.parentPath.parent.type !== 'Program' &&
        path.parentPath.parent.type !== 'ExportNamedDeclaration'
        ) {
        return;
      }
      if (!path.node.init) {
        return;
      }

      if (path.node.init.type !== 'CallExpression') {
        return;
      }

      extractArguments({ types, path }, path.node.init);
    },

    ExportDefaultDeclaration(path) {
      if (path.node.declaration.type !== 'CallExpression') {
        return;
      }

      extractArguments({
        types,
        path,
        forDefaultExport: true
      }, path.node.declaration);
    }
  };

  return {
    visitor: {
      Program: {
        enter(path) {
          path.traverse(Visitor);
        }
      }
    }
  };
};
