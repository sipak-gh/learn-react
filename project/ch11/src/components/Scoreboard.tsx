import { useContext } from 'react'
import { getPhase } from '../game/reducer'
import { rankPlayers } from '../game/scoring'
import { GameStateContext } from './contexts'

/** Live standings, best first. */
export function Scoreboard() {
  const state = useContext(GameStateContext)
  if (!state) throw new Error('Scoreboard must be used inside <GameProvider>')

  // Nobody's turn once the game is over.
  const current = getPhase(state) === 'gameOver' ? null : state.players[state.current].name

  return (
    <ol className="scoreboard">
      {rankPlayers(state.players).map((standing) => (
        <li key={standing.name} className={standing.name === current ? 'current' : undefined}>
          <span className="rank">{standing.rank}.</span>
          <span>{standing.name}</span>
          <strong>{standing.total}</strong>
        </li>
      ))}
    </ol>
  )
}
