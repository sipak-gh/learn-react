export interface Player {
  id: number
  name: string
  best: number
}

const NAMES = ['Ada', 'Bo', 'Cy', 'Di']

interface FetchOptions {
  /** How long the "server" takes to answer, in milliseconds. */
  ms?: number
  signal?: AbortSignal
}

/** A pretend server: answers after `ms` milliseconds, unless `signal` aborts first. */
export function fetchPlayer(id: number, { ms = 800, signal }: FetchOptions = {}): Promise<Player> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const timer = setTimeout(() => {
      if (id < 0) reject(new Error(`No player with id ${id}.`))
      else resolve({ id, name: NAMES[id % NAMES.length], best: 150 + id * 17 })
    }, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(signal.reason)
      },
      { once: true },
    )
  })
}
