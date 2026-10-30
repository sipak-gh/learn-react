import { totals } from '../game/scoring'
import type { Player } from '../game/types'

interface GameOverProps {
  players: readonly Player[]
  onPlayAgain: () => void
}

export function GameOver({ players, onPlayAgain }: GameOverProps) {
  return (
    <div className="game-over">
      <h3>Game over</h3>
      <ul>
        {players.map((player) => (
          <li key={player.name}>
            {player.name}: <strong>{totals(player.sheet).grand}</strong>
          </li>
        ))}
      </ul>
      <button type="button" className="roll-button" onClick={onPlayAgain}>
        Play again
      </button>
    </div>
  )
}
