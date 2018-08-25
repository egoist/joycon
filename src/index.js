import fs from 'fs'
import path from 'path'

/**
 * Read and return file data
 * @param {string} fp file path
 * @return {Promise<string>} file data
 */
const readFile = fp =>
  new Promise((resolve, reject) => {
    fs.readFile(fp, 'utf8', (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })

/**
 * @param {string} fp file path
 */
// eslint-disable-next-line no-unused-vars
const readFileSync = fp => {
  return fs.readFileSync(fp, 'utf8')
}

/**
 * Check if a file exists
 * @param {string} fp file path
 * @return {Promise<boolean>} whether it exists
 */
const pathExists = fp =>
  new Promise(resolve => {
    fs.access(fp, err => {
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
    parseJSON = JSON.parse
  } = {}) {
    this.options = {
      files,
      cwd,
      stopDir,
      packageKey,
      parseJSON
    }
    /** @type {Map<string, boolean>} */
    this.existsCache = new Map()
    /** @type {Set<Loader>} */
    this.loaders = new Set()
    /** @type {Set<string, any>} */
    this.packageJsonCache = new Map()
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
      let exists =
        // Disable cache in tests
        process.env.NODE_ENV !== 'test' && this.existsCache.has(file) ?
          this.existsCache.get(file) :
          await pathExists(file) // eslint-disable-line no-await-in-loop
      // For `package.json`
      // If you specified the `packageKey` option
      // It will only be considered existing when the property exists
      if (
        exists &&
        options.packageKey &&
        path.basename(file) === 'package.json'
      ) {
        const data = require(file)
        delete require.cache[file]
        // The cache will be usd in `.load` method
        // But not in the next `require(filepath)` call
        this.packageJsonCache.set(file, data)
        exists = Object.prototype.hasOwnProperty.call(data, options.packageKey)
      } else {
        this.packageJsonCache.delete(file)
      }

      this.existsCache.set(file, exists)
      if (exists) {
        return file
      }
    }

    // Continue in the parent directory
    return this.recusivelyResolve(
      Object.assign({}, options, { cwd: path.dirname(options.cwd) })
    ) // $MakeMeSync
  }

  // $MakeMeSync
  async resolve(...args) {
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
    options.stopDir = options.stopDir ? path.resolve(options.stopDir) : path.parse(options.cwd).root

    if (!options.files || options.files.length === 0) {
      throw new Error('files must be an non-empty array!')
    }

    return this.recusivelyResolve(options) // $MakeMeSync
  }

  // $MakeMeSync
  async load(...args) {
    const filepath = await this.resolve(...args)
    if (filepath) {
      const loader = this.findLoader(filepath)
      if (loader) {
        return {
          path: filepath,
          data: await loader.load(filepath)
        }
      }

      const extname = path.extname(filepath).slice(1)
      if (extname === 'js') {
        return {
          path: filepath,
          data: require(filepath)
        }
      }

      if (extname === 'json') {
        if (this.packageJsonCache.has(filepath)) {
          return {
            path: filepath,
            data: this.packageJsonCache.get(filepath)
          }
        }

        const data = this.options.parseJSON(await readFile(filepath))
        return {
          path: filepath,
          data
        }
      }

      // Don't parse data
      // If it's neither .js nor .json
      // Leave this to user-land
      return {
        path: filepath,
        data: await readFile(filepath)
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

    return this
  }
}

module.exports = JoyCon
// For TypeScript
module.exports.default = JoyCon
