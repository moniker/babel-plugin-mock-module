const path = require('path');

/**
 * NOTE: this is an adaptation of the module-alias plugin, located here:  https://github.com/tleunen/babel-plugin-module-alias
 *       majority of the code is credit to tleunen
 **/

function createFilesMap(state) {
    const result = {};
    const opts = Array.isArray(state.opts)
        ? state.opts
        : [state.opts];

    opts.forEach(moduleMapData => {
        result[moduleMapData['import']] = { mock: moduleMapData.mock, src: moduleMapData.src };
    });

    return result;
}

function resolve(filename) {
    // if (path.isAbsolute(filename)) return filename;
    // return path.resolve(process.cwd(), filename);
    return path.resolve(filename);
}

export function mapToRelative(currentFile, module) {
    let from = path.dirname(currentFile);
    // let to = path.normalize(module);
    let to = path.join(from,module)

    from = resolve(from);
    to = resolve(to);

    let moduleMapped = path.relative(from, to);

    // TODO: test this 'theory'
    // Support npm modules instead of directories
    // if (moduleMapped.indexOf('npm:') !== -1) {
    //     const [, npmModuleName] = moduleMapped.split('npm:');
    //     return npmModuleName;
    // }

    if (moduleMapped[0] !== '.') moduleMapped = `./${moduleMapped}`;
    return moduleMapped;
}

export function mapModule(source, file, filesMap) {
    const moduleSplit = source.split('/');

    let mock, src;
    while (moduleSplit.length) {
        const m = moduleSplit.join('/');
        if (filesMap.hasOwnProperty(m)) {
            mock = filesMap[m].mock;
            src = filesMap[m].src;
            break;
        }
        moduleSplit.pop();
    }

    if (!moduleSplit.length) {
        // no mapping available
        return null;
    }

    let srcPath = new RegExp(src)

    if (!srcPath.test(file)) {
      // not a matching path
      return null;
    }

    const newPath = source.replace(moduleSplit.join('/'), mock);

    return mapToRelative(file, newPath);
}


export default ({ types: t }) => {

    function transformImportCall(nodePath, state, filesMap) {
        const moduleArg = nodePath.node.source;
        if (moduleArg && moduleArg.type === 'StringLiteral') {
          const modulePath = mapModule(moduleArg.value, state.file.opts.filename, filesMap);
          if (modulePath) {
            nodePath.replaceWith(t.importDeclaration(
              nodePath.node.specifiers,
              t.stringLiteral(modulePath)
            ));
          }
        }
    }

    return {
        visitor: {
            ImportDeclaration: {
                exit(nodePath, state) {
                    return transformImportCall(nodePath, state, createFilesMap(state));
                }
            }
        }
    };
};
