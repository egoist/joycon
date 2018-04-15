const fs = require('fs')
const path = require('path')

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

/**
 * @typedef {(filepath: string) => any} Load
 * @typedef {{test: RegExp, load: Load}} Loader
 */

module.exports = class JoyCon {
  constructor(
    /** @type {string[]} */
    files,
    /** @type {{cwd?: string, stopDir?: string}} */
    { cwd = process.cwd(), stopDir = path.parse(cwd).root } = {}
  ) {
    if (!files || files.length === 0) {
      throw new Error('files must be an non-empty array!')
    }

    this.files = files

    this.options = {
      cwd,
      stopDir
    }
    /** @type {Map<string, boolean>} */
    this.existsCache = new Map()
    /** @type {Set<Loader>} */
    this.loaders = new Set()
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
   * @param {string} cwd Working directory
   * @return {Promise<string|null>}
   */
  async recusivelyResolve(cwd = this.options.cwd) {
    // Don't traverse above the module root
    if (cwd === this.options.stopDir || path.basename(cwd) === 'node_modules') {
      return null
    }

    for (const filename of this.files) {
      const file = path.join(cwd, filename)
      const exists = this.existsCache.has(file) ?
        this.existsCache.get(file) :
        await pathExists(file) // eslint-disable-line no-await-in-loop
      if (exists) {
        this.existsCache.set(file, true)
        return file
      }
    }

    // Continue in the parent directory
    return this.recusivelyResolve(path.dirname(cwd))
  }

  resolve() {
    return this.recusivelyResolve(this.options.cwd)
  }

  /**
   * Load the file in working directory
   */
  async load() {
    const filepath = await this.resolve()
    if (filepath) {
      try {
        const load = this.findLoader(filepath)
        if (load) {
          return {
            path: filepath,
            data: await load(filepath)
          }
        }

        const extname = path.extname(filepath).slice(1)
        if (extname === 'js') {
          return {
            path: filepath,
            data: require(filepath)
          }
        }

        const data = await readFile(filepath)

        if (extname === 'json') {
          return {
            path: filepath,
            data: require('json5').parse(data)
          }
        }

        // Don't parse data
        // If it's neither .js nor .json
        // Leave this to user-land
        return {
          path: filepath,
          data
        }
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND' || err.code === 'ENOENT') {
          this.existsCache.delete(filepath)
          return {}
        }

        throw err
      }
    }

    return {}
  }

  /**
   *  Find a loader for given path
   * @param {string} filepath file path
   * @return {Load|null}
   */
  findLoader(filepath) {
    for (const loader of this.loaders) {
      if (loader.test && loader.test.test(filepath)) {
        return loader.load
      }
    }

    return null
  }
}
