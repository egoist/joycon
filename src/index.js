import fs from 'fs'
import path from 'path'

/**
 * @param {string} fp file path
 */
// eslint-disable-next-line no-unused-vars
const readFileSync = (fp) => {
  return fs.readFileSync(fp, 'utf8')
}

/**
 * Check if a file exists
 * @param {string} fp file path
 * @return {Promise<boolean>} whether it exists
 */
const pathExists = (fp) =>
  new Promise((resolve) => {
    fs.access(fp, (err) => {
      resolve(!err)
    })
  })

// eslint-disable-next-line no-unused-vars
const pathExistsSync = fs.existsSync

export default class JoyCon {
  constructor({
    files,
    cwd = process.cwd(),
    stopDir,
    packageKey,
    parseJSON = JSON.parse,
  } = {}) {
    this.options = {
      files,
      cwd,
      stopDir,
      packageKey,
      parseJSON,
    }
    /** @type {Map<string, boolean>} */
    this.existsCache = new Map()
    /** @type {Set<Loader>} */
    this.loaders = new Set()
    /**
     * We need to read package json data in `.resolve` method to check if `packageKey` exists in the file
     * So it makes sense to cache it if the `.resolve` method is called by `.load` method
     * @type {Set<string, any>}
     */
    this.packageJsonCache = new Map()
    this.loadCache = new Map()
  }

  /**
   * Add a loader
   * @public
   * @param {Loader} loader
   */
  addLoader(loader) {
    this.loaders.add(loader)

    return this
  }

  removeLoader(name) {
    for (const loader of this.loaders) {
      if (name && loader.name === name) {
        this.loaders.delete(loader)
      }
    }

    return this
  }

  // $MakeMeSync
  async recusivelyResolve(options) {
    // Don't traverse above the module root
    if (
      options.cwd === options.stopDir ||
      path.basename(options.cwd) === 'node_modules'
    ) {
      return null
    }

    for (const filename of options.files) {
      const file = path.resolve(options.cwd, filename)
      const exists =
        // Disable cache in tests
        process.env.NODE_ENV !== 'test' && this.existsCache.has(file)
          ? this.existsCache.get(file)
          : await pathExists(file) // eslint-disable-line no-await-in-loop

      this.existsCache.set(file, exists)

      if (exists) {
        // If there's no `packageKey` option or this is not a `package.json` file
        if (!options.packageKey || path.basename(file) !== 'package.json') {
          return file
        }

        // For `package.json` and `packageKey` option
        // We only consider it to exist when the `packageKey` exists
        const data = require(file)
        delete require.cache[file]
        const hasPackageKey = Object.prototype.hasOwnProperty.call(
          data,
          options.packageKey,
        )
        // The cache will be usd in `.load` method
        // But not in the next `require(filepath)` call since we deleted it after require
        // For `package.json`
        // If you specified the `packageKey` option
        // It will only be considered existing when the property exists
        if (hasPackageKey) {
          this.packageJsonCache.set(file, data)
          return file
        }
      }

      continue
    }

    // Continue in the parent directory
    return this.recusivelyResolve(
      Object.assign({}, options, { cwd: path.dirname(options.cwd) }),
    ) // $MakeMeSync
  }

  // $MakeMeSync
  async resolve(...args) {
    const options = this.normalizeOptions(args)
    return this.recusivelyResolve(options) // $MakeMeSync
  }

  runLoaderSync(loader, filepath) {
    return loader.loadSync(filepath)
  }

  runLoader(loader, filepath) {
    if (!loader.load) return loader.loadSync(filepath)
    return loader.load(filepath)
  }

  // $MakeMeSync
  async load(...args) {
    const options = this.normalizeOptions(args)
    const filepath = await this.recusivelyResolve(options)

    if (filepath) {
      const defaultLoader = {
        test: /\.+/,
        loadSync: (filepath) => {
          const extname = path.extname(filepath).slice(1)
          if (extname === 'js' || extname === 'cjs') {
            delete require.cache[filepath]
            return require(filepath)
          }

          if (this.packageJsonCache.has(filepath)) {
            return this.packageJsonCache.get(filepath)[options.packageKey]
          }

          const data = this.options.parseJSON(readFileSync(filepath))
          return data
        },
      }
      const loader = this.findLoader(filepath) || defaultLoader

      let data
      if (this.loadCache.has(filepath)) {
        data = this.loadCache.get(filepath)
      } else {
        data = await this.runLoader(loader, filepath)
        this.loadCache.set(filepath, data)
      }

      return {
        path: filepath,
        data,
      }
    }

    return {}
  }

  /**
   *  Find a loader for given path
   * @param {string} filepath file path
   * @return {Loader|null}
   */
  findLoader(filepath) {
    for (const loader of this.loaders) {
      if (loader.test && loader.test.test(filepath)) {
        return loader
      }
    }

    return null
  }

  /** Clear cache used by this instance */
  clearCache() {
    this.existsCache.clear()
    this.packageJsonCache.clear()
    this.loadCache.clear()

    return this
  }

  normalizeOptions(args) {
    const options = Object.assign({}, this.options)

    if (Object.prototype.toString.call(args[0]) === '[object Object]') {
      Object.assign(options, args[0])
    } else {
      if (args[0]) {
        options.files = args[0]
      }
      if (args[1]) {
        options.cwd = args[1]
      }
      if (args[2]) {
        options.stopDir = args[2]
      }
    }

    options.cwd = path.resolve(options.cwd)
    options.stopDir = options.stopDir
      ? path.resolve(options.stopDir)
      : path.parse(options.cwd).root

    if (!options.files || options.files.length === 0) {
      throw new Error('[joycon] files must be an non-empty array!')
    }

    options.__normalized__ = true

    return options
  }
}

module.exports = JoyCon
// For TypeScript
module.exports.default = JoyCon
