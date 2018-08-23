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

/**
 * @typedef {(filepath: string) => any} Load
 * @typedef {{test: RegExp, load: Load}} Loader
 */

export default class JoyCon {
  constructor(
    /** @type {{files?: string[], cwd?: string, stopDir?: string, packageKey?: string, parseJSON?: (str: string) => any}} */
    { files, cwd = process.cwd(), stopDir, packageKey, parseJSON = JSON.parse } = {}
  ) {
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

  /**
   * Resolve the files in working directory or parent directory
   * @private
   * @param {string[]} files Files to search
   * @param {string} cwd Working directory
   * @param {string} stopDir The directory to stop searching
   * @return {Promise<string|null>}
   */
  // $MakeMeSync
  async recusivelyResolve(files, cwd, stopDir) {
    // Don't traverse above the module root
    if (cwd === stopDir || path.basename(cwd) === 'node_modules') {
      return null
    }

    for (const filename of files) {
      const file = path.resolve(cwd, filename)
      let exists =
        // Disable cache in tests
        process.env.NODE_ENV !== 'test' && this.existsCache.has(file) ?
          this.existsCache.get(file) :
          await pathExists(file) // eslint-disable-line no-await-in-loop
      // For `package.json`
      // If you specified the `packageKey` option
      // It will only be considered existing when the property exists
      if (exists && this.options.packageKey && path.basename(file) === 'package.json') {
        const data = require(file)
        delete require.cache[file]
        // The cache will be usd in `.load` method
        // But not in the next `require(filepath)` call
        this.packageJsonCache.set(file, data)
        exists = Object.prototype.hasOwnProperty.call(data, this.options.packageKey)
      } else {
        this.packageJsonCache.delete(file)
      }

      this.existsCache.set(file, exists)
      if (exists) {
        return file
      }
    }

    // Continue in the parent directory
    return this.recusivelyResolve(files, path.dirname(cwd), stopDir) // $MakeMeSync
  }

  /**
   * Search files and resolve the path
   * @param {string[]=} files Files to search
   * @param {string=} cwd Working directory
   * @param {string=} stopDir The directory to stop searching
   */
  // $MakeMeSync
  async resolve(files, cwd, stopDir) {
    files = files || this.options.files
    cwd = path.resolve(cwd || this.options.cwd)
    stopDir = path.resolve(stopDir || this.options.stopDir || path.parse(cwd).root)

    if (!files || files.length === 0) {
      throw new Error('files must be an non-empty array!')
    }

    return this.recusivelyResolve(files, cwd, stopDir) // $MakeMeSync
  }

  /**
   * Search files and resolve the path and data
   * @param {string[]=} files Files to search
   * @param {string=} cwd Working directory
   * @param {string=} stopDir The directory to stop searching
   */
  // $MakeMeSync
  async load(files, cwd, stopDir) {
    const filepath = await this.resolve(files, cwd, stopDir)
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
