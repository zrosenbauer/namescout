type Extractor = (
  text: string,
  options: typeof EMBED_OPTIONS
) => Promise<{ data: ArrayLike<number> }>

const EMBED_OPTIONS = { normalize: true, pooling: 'mean' } as const

let extractor: Extractor | null = null // oxlint-disable-line functional/no-let -- lazy-loaded singleton

export async function getEmbedder(): Promise<Extractor> {
  if (extractor) {
    return extractor
  }

  const { pipeline } = await import('@xenova/transformers')
  extractor = (await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')) as Extractor
  return extractor
}

async function runModel(model: Extractor, text: string): Promise<Float32Array> {
  const output = await model(text, EMBED_OPTIONS)
  return new Float32Array(output.data)
}

export async function embedText(text: string): Promise<Float32Array> {
  const model = await getEmbedder()
  return runModel(model, text)
}

export async function embedBatch(
  texts: readonly string[],
  batchSize: number = 64
): Promise<Float32Array[]> {
  const model = await getEmbedder()
  const results: Float32Array[] = []

  for (const batch of chunk(texts, batchSize)) {
    const outputs = await Promise.all(batch.map((text) => runModel(model, text)))
    results.push(...outputs)
  }

  return results
}

function chunk<T>(arr: readonly T[], size: number): T[][] {
  return Array.from(
    { length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, (i + 1) * size) as T[]
  )
}
