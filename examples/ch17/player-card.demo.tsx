import { Suspense, use, useState, useTransition } from 'react'
import { fetchPlayer, type Player } from './fake-server.ts'

function PlayerCard({ playerPromise }: { playerPromise: Promise<Player> }) {
  // Suspends until the promise resolves; then returns its value.
  const player = use(playerPromise)
  return (
    <p>
      {player.name}: best score {player.best}
    </p>
  )
}

export default function PlayerCardDemo() {
  const [id, setId] = useState(0)
  // The promise is state: created once, replaced only by the event handler.
  const [playerPromise, setPlayerPromise] = useState(() => fetchPlayer(0))
  const [isPending, startTransition] = useTransition()

  function showNext(asTransition: boolean) {
    const update = () => {
      setId(id + 1)
      setPlayerPromise(fetchPlayer(id + 1))
    }
    if (asTransition) startTransition(update)
    else update()
  }

  return (
    <main>
      <button type="button" onClick={() => showNext(false)}>
        Next player
      </button>{' '}
      <button type="button" onClick={() => showNext(true)}>
        Next player (transition)
      </button>
      {isPending && ' Loading…'}
      <Suspense fallback={<p>Loading player…</p>}>
        <PlayerCard playerPromise={playerPromise} />
      </Suspense>
    </main>
  )
}
