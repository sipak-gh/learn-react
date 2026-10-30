import { useEffect, useState } from 'react'

/** Fetches the name list and keeps the names that start with `query`. */
async function searchNames(query: string, signal: AbortSignal): Promise<string[]> {
  const response = await fetch('/ch11/names.json', { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const names = (await response.json()) as string[]
  return names.filter((name) => name.toLowerCase().startsWith(query.toLowerCase()))
}

export default function AbortSearchDemo() {
  const [query, setQuery] = useState('a')
  const [names, setNames] = useState<string[] | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    searchNames(query, controller.signal)
      .then((found) => setNames(found))
      .catch((error: unknown) => {
        // abort() makes fetch reject with an AbortError: expected, not a failure.
        if (!controller.signal.aborted) console.error(error)
      })
    return () => controller.abort()
  }, [query])

  return (
    <main>
      <label>
        Search <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <p>{names ? names.join(', ') || 'none' : 'Searching…'}</p>
    </main>
  )
}
