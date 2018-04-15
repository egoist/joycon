
# joycon

[![NPM version](https://img.shields.io/npm/v/joycon.svg?style=flat)](https://npmjs.com/package/joycon) [![NPM downloads](https://img.shields.io/npm/dm/joycon.svg?style=flat)](https://npmjs.com/package/joycon) [![CircleCI](https://circleci.com/gh/egoist/joycon/tree/master.svg?style=shield)](https://circleci.com/gh/egoist/joycon/tree/master)  [![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&style=flat)](https://github.com/egoist/donate) [![chat](https://img.shields.io/badge/chat-on%20discord-7289DA.svg?style=flat)](https://chat.egoist.moe)

## Install

```bash
yarn add joycon
```

## Usage

```js
const JoyCon = require('joycon')

const joycon = new JoyCon(['package-lock.json', 'yarn.lock'])

joycon.load()
.then(result => {
  // result is {} when files do not exist
  // otherwise { path, data }
})
```

By default only `.js` and `.json` file are parsed, otherwise raw data will be returned, so you can add custom loader to parse them:

```js
const joycon = new JoyCon(['cargo.toml'])

joycon.addLoader({
  test: /\.toml$/,
  load(filepath) {
    return require('toml').parse(filepath)
  }
})

joycon.load()
```

## DOC

## API

### constructor(files, [options])

#### files

Type: `string[]`

The files to search.

#### options

##### cwd

Working directory to search files.

##### stopDir

Directory where the search will stop. By default it's `path.parse(cwd).root`.

### resolve()

Search files and resolve the path of the file we found.

### load()

Search files and resolve `{ path, data }` of the file we found.

### addLoader(Loader)

```typescript
interface Loader {
  test: RegExp
  load(filepath: string): any
}
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

**joycon** © [egoist](https://github.com/egoist), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by egoist with help from contributors ([list](https://github.com/egoist/joycon/contributors)).

> [github.com/egoist](https://github.com/egoist) · GitHub [@egoist](https://github.com/egoist) · Twitter [@_egoistlily](https://twitter.com/_egoistlily)
