import { rankPlayers } from '../game/scoring'
import { useGameState } from '../hooks/useGame'
import buttons from '../styles/buttons.module.css'
import styles from './GameOver.module.css'

interface GameOverProps {
  onPlayAgain: () => void
}

/** A ref callback defined outside the component, so it is the same function on every render. */
function focusOnMount(node: HTMLElement | null) {
  node?.focus()
}

/** "Ada wins", "Ada and Bo tie" or, for one player, the final score. */
function resultText(winners: string[], total: number, playerCount: number): string {
  if (playerCount === 1) return `Final score: ${total}`
  if (winners.length === 1) return `${winners[0]} wins with ${total}!`
  return `It's a tie: ${new Intl.ListFormat('en').format(winners)} with ${total}!`
}

export function GameOver({ onPlayAgain }: GameOverProps) {
  const state = useGameState()

  const standings = rankPlayers(state.players)
  const winners = standings.filter((standing) => standing.rank === 1).map((standing) => standing.name)

  return (
    <div className={styles.gameOver}>
      {/* tabIndex={-1}: focusable from code, but not a Tab stop. Moving focus
          here makes screen readers read the result straight away. */}
      <p ref={focusOnMount} tabIndex={-1}>
        {resultText(winners, standings[0].total, standings.length)}
      </p>
      <button type="button" className={buttons.primary} onClick={onPlayAgain}>
        Play again
      </button>
    </div>
  )
}
