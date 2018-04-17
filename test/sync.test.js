import path from 'path'
import JoyCon from '../src'

const fixture = name => path.join(__dirname, 'fixtures', name)

describe('resolve', () => {
  it('has json file', () => {
    const fp = new JoyCon().resolveSync(
      ['foo.json'],
      fixture('has-json-file')
    )
    expect(fp.endsWith('foo.json')).toBe(true)
  })

  it('resolves next file', () => {
    const fp = new JoyCon().resolveSync(
      ['bar.json', 'foo.json'],
      fixture('has-json-file')
    )
    expect(fp.endsWith('foo.json')).toBe(true)
  })

  it('returns null when not found', () => {
    const fp = new JoyCon().resolveSync(
      ['hehe.json'],
      fixture('has-json-file')
    )
    expect(fp).toBe(null)
  })
})

describe('load', () => {
  it('has json file', () => {
    const { data } = new JoyCon().loadSync(
      ['foo.json'],
      fixture('has-json-file')
    )
    expect(data).toEqual({ foo: 'foo' })
  })

  it('resolves next file', () => {
    const { data } = new JoyCon().loadSync(
      ['bar.json', 'foo.json'],
      fixture('has-json-file')
    )
    expect(data).toEqual({ foo: 'foo' })
  })

  it('returns {} when not found', () => {
    const res = new JoyCon().loadSync(['hehe.json'], fixture('has-json-file'))
    expect(res).toEqual({})
  })
})
