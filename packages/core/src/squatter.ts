export interface SquatterResult {
  readonly exists: boolean
  readonly squatted: boolean | null
}

export async function checkSquatter(name: string): Promise<SquatterResult> {
  try {
    const squatter = (await import('squatter')).default
    const isSquatted = await squatter(name)
    return { exists: true, squatted: isSquatted }
  } catch (error: any) {
    if (error?.code === 'PackageNotFoundError' || error?.message?.includes('404') || error?.statusCode === 404 || error?.message?.includes("doesn't exist")) {
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
  for (let i = 0; i < names.length; i += CONCURRENCY) {
    const batch = names.slice(i, i + CONCURRENCY)
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
