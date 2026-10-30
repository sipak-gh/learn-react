import { getPhase } from '../game/reducer'
import { rankPlayers } from '../game/scoring'
import { useGameState } from '../hooks/useGame'
import styles from './Scoreboard.module.css'

/** Live standings, best first. */
export function Scoreboard() {
  const state = useGameState()

  // Nobody's turn once the game is over.
  const current = getPhase(state) === 'gameOver' ? null : state.players[state.current].name

  return (
    <ol className={styles.list}>
      {rankPlayers(state.players).map((standing) => (
        <li key={standing.name} className={standing.name === current ? styles.current : undefined}>
          <span>{standing.rank}.</span>
          <span>{standing.name}</span>
          <strong>{standing.total}</strong>
        </li>
      ))}
    </ol>
  )
}
