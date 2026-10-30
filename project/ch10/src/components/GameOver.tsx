import { useContext } from 'react'
import { rankPlayers } from '../game/scoring'
import { GameStateContext } from './contexts'

interface GameOverProps {
  onPlayAgain: () => void
}

/** "Ada wins", "Ada and Bo tie" or, for one player, the final score. */
function resultText(winners: string[], total: number, playerCount: number): string {
  if (playerCount === 1) return `Final score: ${total}`
  if (winners.length === 1) return `${winners[0]} wins with ${total}!`
  return `It's a tie: ${new Intl.ListFormat('en').format(winners)} with ${total}!`
}

export function GameOver({ onPlayAgain }: GameOverProps) {
  const state = useContext(GameStateContext)
  if (!state) throw new Error('GameOver must be used inside <GameProvider>')

  const standings = rankPlayers(state.players)
  const winners = standings.filter((standing) => standing.rank === 1).map((standing) => standing.name)

  return (
    <div className="game-over">
      <p>{resultText(winners, standings[0].total, standings.length)}</p>
      <button type="button" className="roll-button" onClick={onPlayAgain}>
        Play again
      </button>
    </div>
  )
}
