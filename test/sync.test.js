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

  it('package.json but packageKey does not exist', async () => {
    const fp = await new JoyCon({ packageKey: 'name' }).resolveSync(
      ['package.json', 'foo.json'],
      fixture('package-json-no-key')
    )
    expect(fp.endsWith('foo.json')).toBe(true)
  })

  it('package.json', async () => {
    const fp = await new JoyCon({ packageKey: 'what' }).resolveSync(
      ['package.json', 'foo.json'],
      fixture('package-json')
    )
    expect(fp.endsWith('package.json')).toBe(true)
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

  it('package.json but packageKey does not exist', async () => {
    const { data } = await new JoyCon({ packageKey: 'name' }).loadSync(
      ['package.json', 'foo.json'],
      fixture('package-json-no-key')
    )
    expect(data).toEqual({ foo: true })
  })

  it('package.json', async () => {
    const { data } = await new JoyCon({ packageKey: 'what' }).loadSync(
      ['package.json', 'foo.json'],
      fixture('package-json')
    )
    expect(data).toEqual({ what: true })
  })
})
