// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any | null = null

const EMBED_OPTIONS = { pooling: 'mean', normalize: true } as const

export async function getEmbedder(): Promise<any> {
  if (extractor) return extractor

  const { pipeline } = await import('@xenova/transformers')
  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  return extractor
}

async function runModel(model: any, text: string): Promise<Float32Array> {
  const output = await model(text, EMBED_OPTIONS)
  return new Float32Array(output.data)
}

export async function embedText(text: string): Promise<Float32Array> {
  const model = await getEmbedder()
  return runModel(model, text)
}

export async function embedBatch(texts: readonly string[], batchSize: number = 64): Promise<Float32Array[]> {
  const model = await getEmbedder()
  const results: Float32Array[] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const outputs = await Promise.all(batch.map((text) => runModel(model, text)))
    results.push(...outputs)
  }

  return results
}
