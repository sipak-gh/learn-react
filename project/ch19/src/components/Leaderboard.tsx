import { startTransition, Suspense, use, useActionState, useContext, useOptimistic, useState, useTransition } from 'react'
import { addHighScores, type HighScore } from '../game/highScores'
import buttons from '../styles/buttons.module.css'
import tables from '../styles/tables.module.css'
import { LeaderboardContext } from './contexts'
import { ErrorBoundary } from './ErrorBoundary'
import styles from './Leaderboard.module.css'

interface LeaderboardTableProps {
  scoresPromise: Promise<HighScore[]>
  /** Scores on their way to the server, shown optimistically. */
  saving: readonly HighScore[]
}

function LeaderboardTable({ scoresPromise, saving }: LeaderboardTableProps) {
  // use() reads the promise's value. While it is pending, the component
  // "suspends" and the nearest <Suspense> shows its fallback; if it rejects,
  // the nearest error boundary catches the error.
  const scores = use(scoresPromise)
  const rows = addHighScores(scores, saving)

  if (rows.length === 0) {
    return <p className="hint">No scores yet. Finish a game to get on the board!</p>
  }

  return (
    <table className={tables.table}>
      <caption className="visually-hidden">Top {rows.length} scores</caption>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Name</th>
          <th scope="col" className={tables.number}>
            Score
          </th>
          <th scope="col">Date</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((entry, index) => {
          const isSaving = saving.includes(entry)
          return (
            // The table is always replaced as a whole, so the position is a fine key.
            <tr key={index} className={isSaving ? styles.saving : undefined}>
              <td>{index + 1}</td>
              <td>{entry.name}</td>
              <td className={tables.number}>{entry.score}</td>
              <td>{isSaving ? 'Saving…' : entry.date}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

type SubmitState = { status: 'idle' | 'saved' } | { status: 'failed'; message: string }

interface LeaderboardProps {
  /** Final scores the players can submit. Leave out to just show the board. */
  results?: readonly { name: string; score: number }[]
}

export function Leaderboard({ results }: LeaderboardProps) {
  const service = useContext(LeaderboardContext)

  // Promises given to use() must not be created during render: a new promise
  // on every render would suspend forever. Keep it in state instead: created
  // once here, and replaced by event handlers.
  const [scoresPromise, setScoresPromise] = useState(() => service.getTopScores())
  const [isRefreshing, startRefresh] = useTransition()

  // While a submit is in progress, `saving` holds the new scores; afterwards
  // React drops them again (by then the real list includes them).
  const [saving, addSaving] = useOptimistic<HighScore[], HighScore[]>([], (current, added) => [
    ...current,
    ...added,
  ])

  const [submitState, submitAction, isSubmitting] = useActionState(
    async (previous: SubmitState): Promise<SubmitState> => {
      if (!results) return previous
      const date = new Date().toISOString().slice(0, 10)
      const entries = results.map((result) => ({ ...result, date }))
      addSaving(entries)
      try {
        const updated = await service.submitScores(entries)
        // State updates after an `await` need their own startTransition
        // (a current React limitation), or React would show the fallback.
        startTransition(() => setScoresPromise(Promise.resolve(updated)))
        return { status: 'saved' }
      } catch (error) {
        return { status: 'failed', message: error instanceof Error ? error.message : String(error) }
      }
    },
    { status: 'idle' },
  )

  function reload() {
    setScoresPromise(service.getTopScores())
  }

  return (
    <div className={styles.leaderboard}>
      <ErrorBoundary
        onReset={reload}
        fallback={(error, reset) => (
          <div role="alert" className={styles.error}>
            <p>Couldn't load the leaderboard. {error instanceof Error ? error.message : ''}</p>
            <button type="button" className={buttons.secondary} onClick={reset}>
              Try again
            </button>
          </div>
        )}
      >
        <Suspense fallback={<p className="hint">Loading leaderboard…</p>}>
          {/* While a transition is pending, React keeps showing the old table. */}
          <div className={isRefreshing ? styles.stale : undefined}>
            <LeaderboardTable scoresPromise={scoresPromise} saving={saving} />
          </div>
        </Suspense>
      </ErrorBoundary>

      <div className={styles.actions}>
        <button
          type="button"
          className={buttons.secondary}
          disabled={isRefreshing}
          // A Transition: keep the current table on screen while loading.
          onClick={() => startRefresh(reload)}
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>

        {results && (
          <form action={submitAction}>
            <button
              type="submit"
              className={buttons.primary}
              disabled={isSubmitting || submitState.status === 'saved'}
            >
              {results.length === 1 ? 'Submit score' : 'Submit scores'}
            </button>
          </form>
        )}
      </div>

      {submitState.status === 'saved' && <p role="status">Saved!</p>}
      {submitState.status === 'failed' && !isSubmitting && (
        <p role="alert" className={styles.error}>
          Not saved: {submitState.message} Try again.
        </p>
      )}
    </div>
  )
}
