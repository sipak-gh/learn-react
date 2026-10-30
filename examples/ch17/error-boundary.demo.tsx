import { Component, Suspense, use, useState, type ErrorInfo, type ReactNode } from 'react'
import { fetchPlayer, type Player } from './fake-server.ts'

interface BoundaryProps {
  children: ReactNode
}

interface BoundaryState {
  error: Error | null
}

// Error boundaries must be classes: there is no hook for this (yet).
export class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null }

  // Render phase: turn the error into state. Must be pure.
  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  // Commit phase: side effects, such as reporting the error to a server.
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.log(`Reported: ${error.message}`, info.componentStack)
  }

  render() {
    if (this.state.error) return <p role="alert">Something went wrong: {this.state.error.message}</p>
    return this.props.children
  }
}

function PlayerCard({ playerPromise }: { playerPromise: Promise<Player> }) {
  const player = use(playerPromise) // a rejected promise throws here
  return (
    <p>
      {player.name}: best score {player.best}
    </p>
  )
}

export default function ErrorBoundaryDemo() {
  const [id, setId] = useState(0)
  const [playerPromise, setPlayerPromise] = useState(() => fetchPlayer(0))

  function load(next: number) {
    setId(next)
    setPlayerPromise(fetchPlayer(next))
  }

  return (
    <main>
      <button type="button" onClick={() => load(1)}>
        Load player 1
      </button>{' '}
      <button type="button" onClick={() => load(-1)}>
        Load player -1
      </button>
      {/* A new key gives a fresh boundary, without the old error. */}
      <ErrorBoundary key={id}>
        <Suspense fallback={<p>Loading player…</p>}>
          <PlayerCard playerPromise={playerPromise} />
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}
