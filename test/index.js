/* eslint-env mocha */
import path from 'path';
import assert from 'assert';
import { transform } from 'babel-core';
import plugin, { mapToRelative } from '../';

describe('Babel plugin mock module', () => {
  const transformerOpts = {
    plugins: [
      [plugin, [
        {
          'src' : 'some/path/to/file',
          'import': './src/utils',
          'mock': './test/mocks/utils'
        },
        {
          'src' : 'some/path/to/file',
          'import': 'utils/my-util-file',
          'mock': './test/mocks/utils/my-util-file'
        }
      ]]
    ]
  };
  describe('should alias a known path', () => {
    describe.only('using a simple exposed name', () => {
      describe('when requiring the exact name', () => {
        it('with an import statement', () => {
          const code = 'import utils from "./src/utils";';
          const result = transform(code, transformerOpts);

          assert.strictEqual(result.code, 'import utils from "./test/mocks/utils";');
        });
      });

      describe('when requiring a sub file of the exposed name', () => {
        it('with an import statement', () => {
          const code = 'import myUtil from "utils/my-util-file";';
          const result = transform(code, transformerOpts);

          assert.strictEqual(result.code, 'import myUtil from "./test/mocks/utils/my-util-file";');
        });
      });
    });

    describe('using a "complex" exposed name', () => {
      describe('when requiring the exact name', () => {
        it('with an import statement', () => {
          const code = 'import comps from "awesome/components";';
          const result = transform(code, transformerOpts);

          assert.strictEqual(result.code, 'import comps from "./src/components";');
        });
      });

      describe('when requiring a sub file of the exposed name', () => {
        it('with an import statement', () => {
          const code = 'import myComp from "awesome/components/my-comp";';
          const result = transform(code, transformerOpts);

          assert.strictEqual(result.code, 'import myComp from "./src/components/my-comp";');
        });
      });
    });
  });

  describe('should not alias a unknown path', () => {
    describe('when requiring a node module', () => {
      it('with an import statement', () => {
        const code = 'import otherLib from "other-lib";';
        const result = transform(code, transformerOpts);

        assert.strictEqual(result.code, 'import otherLib from "other-lib";');
      });
    });

    describe('when requiring a specific un-mapped file', () => {
      it('with an import statement', () => {
        const code = 'import otherLib from "./l/otherLib";';
        const result = transform(code, transformerOpts);

        assert.strictEqual(result.code, 'import otherLib from "./l/otherLib";');
      });
    });
  });

  describe('should map to relative path when cwd has been changed', () => {
    const cwd = process.cwd();

    before(() => {
      process.chdir('./test');
    });

    after(() => {
      process.chdir(cwd);
    });

    it('with relative filename', () => {
      const currentFile = './utils/test/file.js';
      const result = mapToRelative(currentFile, 'utils/dep');

      assert.strictEqual(result, '../dep');
    });

    it('with absolute filename', () => {
      const currentFile = path.join(process.cwd(), './utils/test/file.js');
      const result = mapToRelative(currentFile, 'utils/dep');

      assert.strictEqual(result, '../dep');
    });
  });

  describe('should support remapping to node modules with "npm:"', () => {
    it('with an import statement', () => {
      const code = 'import concrete from "abstract/thing";';
      const result = transform(code, transformerOpts);

      assert.strictEqual(result.code, 'import concrete from "concrete/thing";');
    });
  });
});
