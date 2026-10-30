import { useState } from 'react'
import { fetchTopScore, type TopScore } from './top-score'

export default function TopScoreButton() {
  const [top, setTop] = useState<TopScore | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      setTop(await fetchTopScore())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <section>
      <button type="button" onClick={load}>
        Load top score
      </button>
      {top && (
        <p>
          Top score: {top.name}, {top.score}
        </p>
      )}
      {error && <p role="alert">Could not load: {error}</p>}
    </section>
  )
}
