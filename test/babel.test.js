const path = require('path');
const fs = require('fs');
const { transformFileSync } = require('babel-core');

const FIXTURES_DIR = path.join(__dirname, '__fixtures__');

function trim(str) {
  return str.replace(/^\s+|\s+$/, '')
}

function specsFromFixtures(cb) {
  fs.readdirSync(FIXTURES_DIR).forEach(fixtureName => {
    const fixtureFile = path.join(FIXTURES_DIR, fixtureName)

    if (fs.statSync(fixtureFile).isFile()) {
      const caseName = fixtureName.replace(/\.js$/, '').split('-').join(' ')

      it(`for ${caseName}`, () => cb({ fixtureFile }))
    }
  })
}

describe('extract HoCs', () => specsFromFixtures(({ fixtureFile }) => {
  const actual = transformFileSync(fixtureFile).code
  const codeWithoutFilename = actual.replace(
    new RegExp(`["']${fixtureFile}["']`, 'g'),
    '__FILENAME__',
  );

  expect(trim(codeWithoutFilename)).toMatchSnapshot();
}));

describe('extract HoCs with copyExactName', () => specsFromFixtures(({ fixtureFile }) => {
  const actual = transformFileSync(fixtureFile, { plugins: [['../../lib/babel', { copyExactName: true }]] }).code
  const codeWithoutFilename = actual.replace(
    new RegExp(`["']${fixtureFile}["']`, 'g'),
    '__FILENAME__',
  );

  expect(trim(codeWithoutFilename)).toMatchSnapshot();
}));
