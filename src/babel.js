function extractArguments({ types, path, forDefaultExport }, node, opts) {
  if (node.type !== 'CallExpression') {
    return;
  }

  node.arguments = node.arguments.map(node => {
    if (types.isCallExpression(node)) {
      extractArguments({ types, path, forDefaultExport }, node, opts);
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

    if (opts.copyExactName) {
      const key = types.identifier(idName);
      const objectLiteral = types.objectExpression([types.objectProperty(key, node)]);
      return types.memberExpression(objectLiteral, key);
    }

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
  return {
    visitor: {
      Program: {
        enter(path, state) {
          path.traverse({
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

              extractArguments({ types, path }, path.node.init, state.opts);
            },

            ExportDefaultDeclaration(path) {
              if (path.node.declaration.type !== 'CallExpression') {
                return;
              }

              extractArguments({
                types,
                path,
                forDefaultExport: true
              }, path.node.declaration, state.opts);
            }
          });
        }
      }
    }
  };
};
