import path from 'path'
import JoyCon from '../src'

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

  it('package.json but packageKey does not exist', async () => {
    const fp = await new JoyCon({ packageKey: 'name' }).resolve(
      ['package.json', 'foo.json'],
      fixture('package-json-no-key')
    )
    expect(fp.endsWith('foo.json')).toBe(true)
  })

  it('package.json', async () => {
    const fp = await new JoyCon({ packageKey: 'what' }).resolve(
      ['package.json', 'foo.json'],
      fixture('package-json')
    )
    expect(fp.endsWith('package.json')).toBe(true)
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

  it('package.json but packageKey does not exist', async () => {
    const { data } = await new JoyCon({ packageKey: 'name' }).load(
      ['package.json', 'foo.json'],
      fixture('package-json-no-key')
    )
    expect(data).toEqual({ foo: true })
  })

  it('package.json', async () => {
    const { data } = await new JoyCon({ packageKey: 'what' }).load(
      ['package.json', 'foo.json'],
      fixture('package-json')
    )
    expect(data).toEqual({ what: true })
  })
})
