import { getPhase } from '../game/reducer'
import { rankPlayers } from '../game/scoring'
import { useGameState } from '../hooks/useGame'

/** Live standings, best first. */
export function Scoreboard() {
  const state = useGameState()

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
