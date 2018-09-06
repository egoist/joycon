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
    packageKey,
    parseJSON = JSON.parse
  } = {}) {
    this.options = {
      files,
      cwd,
      stopDir,
      packageKey,
      parseJSON
    };
    this.existsCache = new Map();
    this.loaders = new Set();
    this.packageJsonCache = new Map();
  }

  addLoader(loader) {
    this.loaders.add(loader);
    return this;
  }

  recusivelyResolve(options) {
    var _this = this;

    return _asyncToGenerator(function* () {
      if (options.cwd === options.stopDir || _path.default.basename(options.cwd) === 'node_modules') {
        return null;
      }

      for (const filename of options.files) {
        const file = _path.default.resolve(options.cwd, filename);

        let exists = process.env.NODE_ENV !== 'test' && _this.existsCache.has(file) ? _this.existsCache.get(file) : yield pathExists(file);

        if (exists && options.packageKey && _path.default.basename(file) === 'package.json') {
          const data = require(file);

          delete require.cache[file];
          exists = Object.prototype.hasOwnProperty.call(data, options.packageKey);

          if (exists) {
            _this.packageJsonCache.set(file, data[options.packageKey]);
          }
        } else {
          _this.packageJsonCache.delete(file);
        }

        _this.existsCache.set(file, exists);

        if (exists) {
          return file;
        }
      }

      return _this.recusivelyResolve(Object.assign({}, options, {
        cwd: _path.default.dirname(options.cwd)
      }));
    })();
  }

  recusivelyResolveSync(options) {
    if (options.cwd === options.stopDir || _path.default.basename(options.cwd) === 'node_modules') {
      return null;
    }

    for (const filename of options.files) {
      const file = _path.default.resolve(options.cwd, filename);

      let exists = process.env.NODE_ENV !== 'test' && this.existsCache.has(file) ? this.existsCache.get(file) : pathExistsSync(file);

      if (exists && options.packageKey && _path.default.basename(file) === 'package.json') {
        const data = require(file);

        delete require.cache[file];
        exists = Object.prototype.hasOwnProperty.call(data, options.packageKey);

        if (exists) {
          this.packageJsonCache.set(file, data[options.packageKey]);
        }
      } else {
        this.packageJsonCache.delete(file);
      }

      this.existsCache.set(file, exists);

      if (exists) {
        return file;
      }
    }

    return this.recusivelyResolveSync(Object.assign({}, options, {
      cwd: _path.default.dirname(options.cwd)
    }));
  }

  resolve(...args) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const options = Object.assign({}, _this2.options);

      if (Object.prototype.toString.call(args[0]) === '[object Object]') {
        Object.assign(options, args[0]);
      } else {
        if (args[0]) {
          options.files = args[0];
        }

        if (args[1]) {
          options.cwd = args[1];
        }

        if (args[2]) {
          options.stopDir = args[2];
        }
      }

      options.cwd = _path.default.resolve(options.cwd);
      options.stopDir = options.stopDir ? _path.default.resolve(options.stopDir) : _path.default.parse(options.cwd).root;

      if (!options.files || options.files.length === 0) {
        throw new Error('files must be an non-empty array!');
      }

      return _this2.recusivelyResolve(options);
    })();
  }

  resolveSync(...args) {
    const options = Object.assign({}, this.options);

    if (Object.prototype.toString.call(args[0]) === '[object Object]') {
      Object.assign(options, args[0]);
    } else {
      if (args[0]) {
        options.files = args[0];
      }

      if (args[1]) {
        options.cwd = args[1];
      }

      if (args[2]) {
        options.stopDir = args[2];
      }
    }

    options.cwd = _path.default.resolve(options.cwd);
    options.stopDir = options.stopDir ? _path.default.resolve(options.stopDir) : _path.default.parse(options.cwd).root;

    if (!options.files || options.files.length === 0) {
      throw new Error('files must be an non-empty array!');
    }

    return this.recusivelyResolveSync(options);
  }

  load(...args) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      const filepath = yield _this3.resolve(...args);

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

          const data = _this3.options.parseJSON((yield readFile(filepath)));

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

  loadSync(...args) {
    const filepath = this.resolveSync(...args);

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

        const data = this.options.parseJSON(readFileSync(filepath));
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