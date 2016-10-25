'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.mapToRelative = mapToRelative;
exports.mapModule = mapModule;
var path = require('path');

/**
 * NOTE: this is an adaptation of the module-alias plugin, located here:  https://github.com/tleunen/babel-plugin-module-alias
 *       majority of the code is credit to tleunen
 **/

function createFilesMap(state) {
    var result = {};
    var opts = Array.isArray(state.opts) ? state.opts : [state.opts];

    opts.forEach(function (moduleMapData) {
        result[moduleMapData['import']] = { mock: moduleMapData.mock, src: moduleMapData.src };
    });

    return result;
}

function resolve(filename) {
    // if (path.isAbsolute(filename)) return filename;
    // return path.resolve(process.cwd(), filename);
    return path.resolve(filename);
}

function mapToRelative(currentFile, module) {
    var from = path.dirname(currentFile);
    // let to = path.normalize(module);
    var to = path.join(from, module);

    from = resolve(from);
    to = resolve(to);

    var moduleMapped = path.relative(from, to);

    // TODO: test this 'theory'
    // Support npm modules instead of directories
    // if (moduleMapped.indexOf('npm:') !== -1) {
    //     const [, npmModuleName] = moduleMapped.split('npm:');
    //     return npmModuleName;
    // }

    if (moduleMapped[0] !== '.') moduleMapped = './' + moduleMapped;
    return moduleMapped;
}

function mapModule(source, file, filesMap) {
    var moduleSplit = source.split('/');

    var mock = void 0,
        src = void 0;
    while (moduleSplit.length) {
        var m = moduleSplit.join('/');
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

    var srcPath = new RegExp(src);

    if (!srcPath.test(file)) {
        // not a matching path
        return null;
    }

    var newPath = source.replace(moduleSplit.join('/'), mock);

    return mapToRelative(file, newPath);
}

exports.default = function (_ref) {
    var t = _ref.types;


    function transformImportCall(nodePath, state, filesMap) {
        var moduleArg = nodePath.node.source;
        if (moduleArg && moduleArg.type === 'StringLiteral') {
            var modulePath = mapModule(moduleArg.value, state.file.opts.filename, filesMap);
            if (modulePath) {
                nodePath.replaceWith(t.importDeclaration(nodePath.node.specifiers, t.stringLiteral(modulePath)));
            }
        }
    }

    return {
        visitor: {
            ImportDeclaration: {
                exit: function exit(nodePath, state) {
                    return transformImportCall(nodePath, state, createFilesMap(state));
                }
            }
        }
    };
};