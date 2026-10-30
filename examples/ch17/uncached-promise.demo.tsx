import { Suspense, use } from 'react'
import { fetchPlayer } from './fake-server.ts'

// WRONG: a new promise on every render. Watch the console.
function PlayerCard() {
  const player = use(fetchPlayer(0, { ms: 300 }))
  return (
    <p>
      {player.name}: best score {player.best}
    </p>
  )
}

export default function UncachedPromiseDemo() {
  return (
    <Suspense fallback={<p>Loading player…</p>}>
      <PlayerCard />
    </Suspense>
  )
}
