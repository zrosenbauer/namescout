// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any | null = null

export async function getEmbedder(): Promise<any> {
  if (extractor) return extractor

  const { pipeline } = await import('@xenova/transformers')
  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  return extractor
}

export async function embedText(text: string): Promise<Float32Array> {
  const model = await getEmbedder()
  const output = await model(text, { pooling: 'mean', normalize: true })
  return new Float32Array(output.data)
}

export async function embedBatch(texts: readonly string[], batchSize: number = 64): Promise<Float32Array[]> {
  const model = await getEmbedder()
  const results: Float32Array[] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const outputs = await Promise.all(
      batch.map(async (text) => {
        const output = await model(text, { pooling: 'mean', normalize: true })
        return new Float32Array(output.data)
      })
    )
    results.push(...outputs)
  }

  return results
}
