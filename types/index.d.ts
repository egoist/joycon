export interface Options {
  /* a list of files to search */
  files?: string[]
  /* the directory to search from */
  cwd?: string
  /* the directory to stop searching */
  stopDir?: string
  /* the key in package.json to read data at */
  packageKey?: string
  /* the function used to parse json */
  parseJSON?: (str: string) => any
}

export interface LoadResult {
  /* file path */
  path?: string
  /* file data */
  data?: any
}

export interface AsyncLoader {
  test: RegExp
  load(filepath: string): Promise<any>
}

export interface SyncLoader {
  test: RegExp
  loadSync(filepath: string): any
}

export interface MultiLoader {
  test: RegExp
  load(filepath: string): Promise<any>
  loadSync(filepath: string): any
}

declare class JoyCon {
  constructor(options: Options)

  resolve(files?: string[], cwd?: string, stopDir?: string): Promise<string | null>
  resolveSync(files?: string[], cwd?: string, stopDir?: string): string | null

  load(files?: string[], cwd?: string, stopDir?: string): Promise<LoadResult>
  loadSync(files?: string[], cwd?: string, stopDir?: string): LoadResult

  addLoader(loader: AsyncLoader | SyncLoader | MultiLoader): this
}


export default JoyCon
