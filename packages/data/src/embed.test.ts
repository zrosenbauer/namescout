import { embedText } from './embed.js'

describe('embedText', () => {
  it('returns a 384-dim Float32Array', async () => {
    const embedding = await embedText('react')
    expect(embedding).toBeInstanceOf(Float32Array)
    expect(embedding).toHaveLength(384)
  }, 60_000)

  it('produces different embeddings for different terms', async () => {
    const a = await embedText('react')
    const b = await embedText('database')
    expect(a).not.toStrictEqual(b)
  }, 60_000)
})
