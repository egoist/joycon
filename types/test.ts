import JoyCon from '..'

const joycon = new JoyCon({
  files: ['foo.js']
})

joycon.resolve()
.then(path => {
  console.log(path)
})

joycon.load()
.then(res => {
  console.log(res.path)
  console.log(res.data)
})

joycon.loadSync()

joycon.addLoader({
  test: /\.ts$/,
  loadSync(fp) {
    return 123
  }
})

joycon.clearCache()
