export interface SquatterResult {
  readonly exists: boolean
  readonly squatted: boolean | null
}

export async function checkSquatter(name: string): Promise<SquatterResult> {
  try {
    // @ts-expect-error -- squatter has no type declarations
    const squatterModule = await import('squatter')
    const squatter = squatterModule.default
    const isSquatted = await squatter(name)
    return { exists: true, squatted: isSquatted }
  } catch (error: unknown) {
    const err = error as Record<string, unknown>
    if (
      err?.code === 'PackageNotFoundError' ||
      (typeof err?.message === 'string' && err.message.includes('404')) ||
      err?.statusCode === 404 ||
      (typeof err?.message === 'string' && err.message.includes("doesn't exist"))
    ) {
      return { exists: false, squatted: null }
    }
    throw error
  }
}

export async function checkSquatterBatch(
  names: readonly string[]
): Promise<Map<string, SquatterResult>> {
  const results = new Map<string, SquatterResult>()

  const CONCURRENCY = 5
  const batches = chunkNames(names, CONCURRENCY)
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(async (name) => ({
        name,
        result: await checkSquatter(name),
      }))
    )
    for (const { name, result } of batchResults) {
      results.set(name, result)
    }
  }

  return results
}

function chunkNames(arr: readonly string[], size: number): string[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, (i + 1) * size)
  )
}
