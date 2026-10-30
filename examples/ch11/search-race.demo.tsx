import { useEffect, useState } from 'react'
import { slowSearch } from './slow-search'

interface ResultsProps {
  query: string
  search: (query: string) => Promise<string[]>
  ignoreStale: boolean
}

export function Results({ query, search, ignoreStale }: ResultsProps) {
  const [answer, setAnswer] = useState<{ query: string; names: string[] } | null>(null)

  useEffect(() => {
    let ignore = false
    search(query).then((names) => {
      if (ignore && ignoreStale) return // a newer query has replaced this one
      setAnswer({ query, names })
    })
    return () => {
      ignore = true
    }
  }, [query, search, ignoreStale])

  if (!answer) return <p>Searching…</p>
  return (
    <p>
      Results for "{answer.query}": {answer.names.join(', ') || 'none'}
    </p>
  )
}

export default function SearchRaceDemo() {
  const [query, setQuery] = useState('a')
  const [ignoreStale, setIgnoreStale] = useState(true)

  return (
    <main>
      <label>
        Search <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <label>
        <input type="checkbox" checked={ignoreStale} onChange={(event) => setIgnoreStale(event.target.checked)} />
        Ignore stale responses
      </label>
      <Results query={query} search={slowSearch} ignoreStale={ignoreStale} />
    </main>
  )
}
