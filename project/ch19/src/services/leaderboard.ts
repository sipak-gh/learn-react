import { addHighScores, type HighScore } from '../game/highScores'

/**
 * What the app needs from a leaderboard server. Components only see this
 * interface, so tests (and one day a real server) can provide another one.
 */
export interface LeaderboardService {
  /** The top scores, best first. */
  getTopScores(options?: RequestOptions): Promise<HighScore[]>
  /** Add new scores; resolves with the updated top scores. */
  submitScores(entries: readonly HighScore[], options?: RequestOptions): Promise<HighScore[]>
}

export interface RequestOptions {
  /** Abort the request with `controller.abort()`. */
  signal?: AbortSignal
}

export interface FakeLeaderboardOptions {
  /** Average simulated network delay, in milliseconds. */
  latency?: number
  /** The chance (0 to 1) that a request fails. */
  failureRate?: number
  storageKey?: string
}

/** Resolve after `ms` milliseconds, or reject as soon as `signal` aborts. */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    if (ms <= 0) return resolve() // no latency (in tests): no timer either
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(signal.reason) // a DOMException named "AbortError"
      },
      { once: true },
    )
  })
}

/**
 * A pretend leaderboard server: the data lives in localStorage, but every
 * request is slow and may fail, like a real network request.
 */
export function createFakeLeaderboard({
  latency = 600,
  failureRate = 0,
  storageKey = 'five-dice:leaderboard:v1',
}: FakeLeaderboardOptions = {}): LeaderboardService {
  function load(): HighScore[] {
    try {
      const data: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  async function request<T>(work: () => T, signal?: AbortSignal): Promise<T> {
    // Somewhere between half and one and a half times the average latency.
    await delay(latency * (0.5 + Math.random()), signal)
    if (Math.random() < failureRate) throw new Error('The leaderboard server did not respond.')
    return work()
  }

  // The read that is in flight right now, if any.
  let pendingRead: Promise<HighScore[]> | null = null

  return {
    getTopScores(options = {}) {
      if (options.signal) return request(load, options.signal)
      // Callers asking at the same time share one request, as data-fetching
      // libraries do. (StrictMode runs a useState initializer twice in
      // development: without this, the second, unused promise could fail
      // with nobody listening, logging "Uncaught (in promise)".)
      pendingRead ??= request(load).finally(() => {
        pendingRead = null
      })
      return pendingRead
    },
    submitScores: (entries, options = {}) =>
      request(() => {
        const updated = addHighScores(load(), entries)
        localStorage.setItem(storageKey, JSON.stringify(updated))
        return updated
      }, options.signal),
  }
}

/** Add ?failure=0.5 to the address to make half of all requests fail. */
export function failureRateFromUrl(): number {
  const rate = Number(new URLSearchParams(window.location.search).get('failure'))
  return rate >= 0 && rate <= 1 ? rate : 0
}
