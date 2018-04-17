"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

/**
 * Read and return file data
 * @param {string} fp file path
 * @return {Promise<string>} file data
 */
const readFile = fp => new Promise((resolve, reject) => {
  _fs.default.readFile(fp, 'utf8', (err, data) => {
    if (err) return reject(err);
    resolve(data);
  });
}); // eslint-disable-next-line no-unused-vars


const readFileSync = fp => {
  return _fs.default.readFileSync(fp, 'utf8');
};
/**
 * Check if a file exists
 * @param {string} fp file path
 * @return {Promise<boolean>} whether it exists
 */


const pathExists = fp => new Promise(resolve => {
  _fs.default.access(fp, err => {
    resolve(!err);
  });
}); // eslint-disable-next-line no-unused-vars


const pathExistsSync = _fs.default.existsSync;
/**
 * @typedef {(filepath: string) => any} Load
 * @typedef {{test: RegExp, load: Load}} Loader
 */

class JoyCon {
  constructor(
  /** @type {{files?: string[], cwd?: string}} */
  {
    files,
    cwd = process.cwd()
  } = {}) {
    this.options = {
      files,
      cwd
      /** @type {Map<string, boolean>} */

    };
    this.existsCache = new Map();
    /** @type {Set<Loader>} */

    this.loaders = new Set();
  }
  /**
   * Add a loader
   * @public
   * @param {Loader} loader
   */


  addLoader(loader) {
    this.loaders.add(loader);
    return this;
  }
  /**
   * Resolve the files in working directory or parent directory
   * @private
   * @param {string[]} files Files to search
   * @param {string} cwd Working directory
   * @param {string} stopDir The directory to stop searching
   * @return {Promise<string|null>}
   */
  // __SYNCED__


  recusivelyResolve(files, cwd, stopDir) {
    var _this = this;

    return _asyncToGenerator(function* () {
      // Don't traverse above the module root
      if (cwd === stopDir || _path.default.basename(cwd) === 'node_modules') {
        return null;
      }

      for (const filename of files) {
        const file = _path.default.join(cwd, filename);

        const exists = // Disable cache in tests
        process.env.NODE_ENV !== 'test' && _this.existsCache.has(file) ? _this.existsCache.get(file) : yield pathExists(file); // eslint-disable-line no-await-in-loop

        if (exists) {
          _this.existsCache.set(file, true);

          return file;
        }
      } // Continue in the parent directory


      return _this.recusivelyResolve(files, _path.default.dirname(cwd), stopDir); // $MakeMeSync
    })();
  }

  recusivelyResolveSync(files, cwd, stopDir) {
    if (cwd === stopDir || _path.default.basename(cwd) === 'node_modules') {
      return null;
    }

    for (const filename of files) {
      const file = _path.default.join(cwd, filename);

      const exists = process.env.NODE_ENV !== 'test' && this.existsCache.has(file) ? this.existsCache.get(file) : pathExistsSync(file);

      if (exists) {
        this.existsCache.set(file, true);
        return file;
      }
    }

    return this.recusivelyResolveSync(files, _path.default.dirname(cwd), stopDir);
  }
  /**
   * Search files and resolve the path
   * @param {string[]=} files Files to search
   * @param {string=} cwd Working directory
   * @param {string=} stopDir The directory to stop searching
   */
  // __SYNCED__


  resolve(files, cwd, stopDir) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      files = files || _this2.options.files;
      cwd = cwd || _this2.options.cwd;
      stopDir = stopDir || _path.default.parse(cwd).root;

      if (!files || files.length === 0) {
        throw new Error('files must be an non-empty array!');
      }

      return _this2.recusivelyResolve(files, cwd, stopDir); // $MakeMeSync
    })();
  }

  resolveSync(files, cwd, stopDir) {
    files = files || this.options.files;
    cwd = cwd || this.options.cwd;
    stopDir = stopDir || _path.default.parse(cwd).root;

    if (!files || files.length === 0) {
      throw new Error('files must be an non-empty array!');
    }

    return this.recusivelyResolveSync(files, cwd, stopDir);
  }
  /**
   * Search files and resolve the path and data
   * @param {string[]=} files Files to search
   * @param {string=} cwd Working directory
   * @param {string=} stopDir The directory to stop searching
   */
  // __SYNCED__


  load(files, cwd, stopDir) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      const filepath = yield _this3.resolve(files, cwd, stopDir);

      if (filepath) {
        try {
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

          const data = yield readFile(filepath);

          if (extname === 'json') {
            return {
              path: filepath,
              data: require('json5').parse(data)
            };
          } // Don't parse data
          // If it's neither .js nor .json
          // Leave this to user-land


          return {
            path: filepath,
            data
          };
        } catch (err) {
          if (err.code === 'MODULE_NOT_FOUND' || err.code === 'ENOENT') {
            _this3.existsCache.delete(filepath);

            return {};
          }

          throw err;
        }
      }

      return {};
    })();
  }

  loadSync(files, cwd, stopDir) {
    const filepath = this.resolveSync(files, cwd, stopDir);

    if (filepath) {
      try {
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

        const data = readFileSync(filepath);

        if (extname === 'json') {
          return {
            path: filepath,
            data: require('json5').parse(data)
          };
        }

        return {
          path: filepath,
          data
        };
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND' || err.code === 'ENOENT') {
          this.existsCache.delete(filepath);
          return {};
        }

        throw err;
      }
    }

    return {};
  }
  /**
   *  Find a loader for given path
   * @param {string} filepath file path
   * @return {Load|null}
   */


  findLoader(filepath) {
    for (const loader of this.loaders) {
      if (loader.test && loader.test.test(filepath)) {
        return loader;
      }
    }

    return null;
  }
  /** Clear cache used by this instance */


  clearCache() {
    this.existsCache.clear();
    return this;
  }

}

exports.default = JoyCon;
module.exports = exports["default"];