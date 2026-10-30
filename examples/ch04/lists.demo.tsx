import { Fragment } from 'react'

interface Player {
  id: string
  name: string
  score: number
}

const PLAYERS: Player[] = [
  { id: 'p1', name: 'Ada', score: 212 },
  { id: 'p2', name: 'Bo', score: 87 },
  { id: 'p3', name: 'Cy', score: 154 },
]

export default function Lists() {
  // Sort a copy (toSorted), never the shared array.
  const ranked = PLAYERS.toSorted((a, b) => b.score - a.score)
  const over100 = PLAYERS.filter((player) => player.score > 100)

  return (
    <>
      <h2>Standings</h2>
      <ol>
        {ranked.map((player) => (
          <li key={player.id}>
            {player.name}: {player.score}
          </li>
        ))}
      </ol>

      <h2>Over 100</h2>
      <ul>
        {over100.map((player) => (
          <li key={player.id}>{player.name}</li>
        ))}
      </ul>

      <h2>Details</h2>
      <dl>
        {/* Two elements per item: a keyed Fragment groups them without a wrapper. */}
        {PLAYERS.map((player) => (
          <Fragment key={player.id}>
            <dt>{player.name}</dt>
            <dd>{player.score} points</dd>
          </Fragment>
        ))}
      </dl>
    </>
  )
}
