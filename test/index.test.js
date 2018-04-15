const path = require('path')
const JoyCon = require('../')

const fixture = name => path.join(__dirname, 'fixtures', name)

describe('resolve', () => {
  it('has json file', async () => {
    const fp = await new JoyCon().resolve(
      ['foo.json'],
      fixture('has-json-file')
    )
    expect(fp.endsWith('foo.json')).toBe(true)
  })

  it('resolves next file', async () => {
    const fp = await new JoyCon().resolve(
      ['bar.json', 'foo.json'],
      fixture('has-json-file')
    )
    expect(fp.endsWith('foo.json')).toBe(true)
  })

  it('returns null when not found', async () => {
    const fp = await new JoyCon().resolve(
      ['hehe.json'],
      fixture('has-json-file')
    )
    expect(fp).toBe(null)
  })
})

describe('load', () => {
  it('has json file', async () => {
    const { data } = await new JoyCon().load(
      ['foo.json'],
      fixture('has-json-file')
    )
    expect(data).toEqual({ foo: 'foo' })
  })

  it('resolves next file', async () => {
    const { data } = await new JoyCon().load(
      ['bar.json', 'foo.json'],
      fixture('has-json-file')
    )
    expect(data).toEqual({ foo: 'foo' })
  })

  it('returns {} when not found', async () => {
    const res = await new JoyCon().load(['hehe.json'], fixture('has-json-file'))
    expect(res).toEqual({})
  })
})
