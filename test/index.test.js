const path = require('path')
const JoyCon = require('../')

const fixture = name => path.join(__dirname, 'fixtures', name)

describe('resolve', () => {
  it('has json file', async () => {
    const fp = await new JoyCon(['foo.json'], {
      cwd: fixture('has-json-file')
    }).resolve()
    expect(fp.endsWith('foo.json')).toBe(true)
  })

  it('resolves next file', async () => {
    const fp = await new JoyCon(['bar.json', 'foo.json'], {
      cwd: fixture('has-json-file')
    }).resolve()
    expect(fp.endsWith('foo.json')).toBe(true)
  })

  it('returns null when not found', async () => {
    const fp = await new JoyCon(['hehe.json'], {
      cwd: fixture('has-json-file')
    }).resolve()
    expect(fp).toBe(null)
  })
})

describe('load', () => {
  it('has json file', async () => {
    const { data } = await new JoyCon(['foo.json'], {
      cwd: fixture('has-json-file')
    }).load()
    expect(data).toEqual({ foo: 'foo' })
  })

  it('resolves next file', async () => {
    const { data } = await new JoyCon(['bar.json', 'foo.json'], {
      cwd: fixture('has-json-file')
    }).load()
    expect(data).toEqual({ foo: 'foo' })
  })

  it('returns {} when not found', async () => {
    const res = await new JoyCon(['hehe.json'], {
      cwd: fixture('has-json-file')
    }).load()
    expect(res).toEqual({})
  })
})
