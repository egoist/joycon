import path from 'path'
import JoyCon from '../src'

const fixture = name => path.join(__dirname, 'fixtures', name)

describe('resolve', () => {
  it('has json file', () => {
    const fp = new JoyCon().resolveSync({
      files: ['foo.json'],
      cwd: fixture('has-json-file')
    })
    expect(fp.endsWith('foo.json')).toBe(true)
  })

  it('resolves next file', () => {
    const fp = new JoyCon().resolveSync({
      files: ['bar.json', 'foo.json'],
      cwd: fixture('has-json-file')
    })
    expect(fp.endsWith('foo.json')).toBe(true)
  })

  it('returns null when not found', () => {
    const fp = new JoyCon().resolveSync({
      files: ['hehe.json'],
      cwd: fixture('has-json-file')
    })
    expect(fp).toBe(null)
  })

  it('package.json but packageKey does not exist', () => {
    const fp = new JoyCon({ packageKey: 'name' }).resolveSync({
      files: ['package.json', 'foo.json'],
      cwd: fixture('package-json-no-key')
    })
    expect(fp.endsWith('foo.json')).toBe(true)
  })

  it('package.json', () => {
    const fp = new JoyCon({ packageKey: 'what' }).resolveSync({
      files: ['package.json', 'foo.json'],
      cwd: fixture('package-json')
    })
    expect(fp.endsWith('package.json')).toBe(true)
  })
})

describe('load', () => {
  it('has json file', () => {
    const { data } = new JoyCon().loadSync({
      files: ['foo.json'],
      cwd: fixture('has-json-file')
    })
    expect(data).toEqual({ foo: 'foo' })
  })

  it('resolves next file', () => {
    const { data } = new JoyCon().loadSync({
      files: ['bar.json', 'foo.json'],
      cwd: fixture('has-json-file')
    })
    expect(data).toEqual({ foo: 'foo' })
  })

  it('returns {} when not found', () => {
    const res = new JoyCon().loadSync({
      files: ['hehe.json'],
      cwd: fixture('has-json-file')
    })
    expect(res).toEqual({})
  })

  it('package.json but packageKey does not exist', () => {
    const { data } = new JoyCon({ packageKey: 'name' }).loadSync({
      files: ['package.json', 'foo.json'],
      cwd: fixture('package-json-no-key')
    })
    expect(data).toEqual({ foo: true })
  })

  it('package.json', () => {
    const { data } = new JoyCon({ packageKey: 'what' }).loadSync({
      files: ['package.json', 'foo.json'],
      cwd: fixture('package-json')
    })
    expect(data).toEqual('is this')
  })
})
