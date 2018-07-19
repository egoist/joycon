"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const readFile = fp => new Promise((resolve, reject) => {
  _fs.default.readFile(fp, 'utf8', (err, data) => {
    if (err) return reject(err);
    resolve(data);
  });
});

const readFileSync = fp => {
  return _fs.default.readFileSync(fp, 'utf8');
};

const pathExists = fp => new Promise(resolve => {
  _fs.default.access(fp, err => {
    resolve(!err);
  });
});

const pathExistsSync = _fs.default.existsSync;

class JoyCon {
  constructor({
    files,
    cwd = process.cwd(),
    stopDir,
    packageKey
  } = {}) {
    this.options = {
      files,
      cwd,
      stopDir,
      packageKey
    };
    this.existsCache = new Map();
    this.loaders = new Set();
    this.packageJsonCache = new Map();
  }

  addLoader(loader) {
    this.loaders.add(loader);
    return this;
  }

  recusivelyResolve(files, cwd, stopDir) {
    var _this = this;

    return _asyncToGenerator(function* () {
      if (cwd === stopDir || _path.default.basename(cwd) === 'node_modules') {
        return null;
      }

      for (const filename of files) {
        const file = _path.default.resolve(cwd, filename);

        let exists = process.env.NODE_ENV !== 'test' && _this.existsCache.has(file) ? _this.existsCache.get(file) : yield pathExists(file);

        if (exists && _this.options.packageKey && _path.default.basename(file) === 'package.json') {
          const data = require(file);

          delete require.cache[file];

          _this.packageJsonCache.set(file, data);

          exists = Object.prototype.hasOwnProperty.call(data, _this.options.packageKey);
        } else {
          _this.packageJsonCache.delete(file);
        }

        _this.existsCache.set(file, exists);

        if (exists) {
          return file;
        }
      }

      return _this.recusivelyResolve(files, _path.default.dirname(cwd), stopDir);
    })();
  }

  recusivelyResolveSync(files, cwd, stopDir) {
    if (cwd === stopDir || _path.default.basename(cwd) === 'node_modules') {
      return null;
    }

    for (const filename of files) {
      const file = _path.default.resolve(cwd, filename);

      let exists = process.env.NODE_ENV !== 'test' && this.existsCache.has(file) ? this.existsCache.get(file) : pathExistsSync(file);

      if (exists && this.options.packageKey && _path.default.basename(file) === 'package.json') {
        const data = require(file);

        delete require.cache[file];
        this.packageJsonCache.set(file, data);
        exists = Object.prototype.hasOwnProperty.call(data, this.options.packageKey);
      } else {
        this.packageJsonCache.delete(file);
      }

      this.existsCache.set(file, exists);

      if (exists) {
        return file;
      }
    }

    return this.recusivelyResolveSync(files, _path.default.dirname(cwd), stopDir);
  }

  resolve(files, cwd, stopDir) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      files = files || _this2.options.files;
      cwd = cwd || _this2.options.cwd;
      stopDir = stopDir || _this2.options.stopDir || _path.default.parse(cwd).root;

      if (!files || files.length === 0) {
        throw new Error('files must be an non-empty array!');
      }

      return _this2.recusivelyResolve(files, cwd, stopDir);
    })();
  }

  resolveSync(files, cwd, stopDir) {
    files = files || this.options.files;
    cwd = cwd || this.options.cwd;
    stopDir = stopDir || this.options.stopDir || _path.default.parse(cwd).root;

    if (!files || files.length === 0) {
      throw new Error('files must be an non-empty array!');
    }

    return this.recusivelyResolveSync(files, cwd, stopDir);
  }

  load(files, cwd, stopDir) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      const filepath = yield _this3.resolve(files, cwd, stopDir);

      if (filepath) {
        const loader = _this3.findLoader(filepath);

        if (loader) {
          return {
            path: filepath,
            data: yield loader.load(filepath)
          };
        }

        const extname = _path.default.extname(filepath).slice(1);

        if (extname === 'js') {
          return {
            path: filepath,
            data: require(filepath)
          };
        }

        if (extname === 'json') {
          if (_this3.packageJsonCache.has(filepath)) {
            return {
              path: filepath,
              data: _this3.packageJsonCache.get(filepath)
            };
          }

          const data = require('json5').parse((yield readFile(filepath)));

          return {
            path: filepath,
            data
          };
        }

        return {
          path: filepath,
          data: yield readFile(filepath)
        };
      }

      return {};
    })();
  }

  loadSync(files, cwd, stopDir) {
    const filepath = this.resolveSync(files, cwd, stopDir);

    if (filepath) {
      const loader = this.findLoader(filepath);

      if (loader) {
        return {
          path: filepath,
          data: loader.loadSync(filepath)
        };
      }

      const extname = _path.default.extname(filepath).slice(1);

      if (extname === 'js') {
        return {
          path: filepath,
          data: require(filepath)
        };
      }

      if (extname === 'json') {
        if (this.packageJsonCache.has(filepath)) {
          return {
            path: filepath,
            data: this.packageJsonCache.get(filepath)
          };
        }

        const data = require('json5').parse(readFileSync(filepath));

        return {
          path: filepath,
          data
        };
      }

      return {
        path: filepath,
        data: readFileSync(filepath)
      };
    }

    return {};
  }

  findLoader(filepath) {
    for (const loader of this.loaders) {
      if (loader.test && loader.test.test(filepath)) {
        return loader;
      }
    }

    return null;
  }

  clearCache() {
    this.existsCache.clear();
    return this;
  }

}

exports.default = JoyCon;
module.exports = JoyCon;
module.exports.default = JoyCon;