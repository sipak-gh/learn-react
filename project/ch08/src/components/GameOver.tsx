interface GameOverProps {
  total: number
  onPlayAgain: () => void
}

export function GameOver({ total, onPlayAgain }: GameOverProps) {
  return (
    <div className="game-over">
      <h3>Game over</h3>
      <p>
        Final score: <strong>{total}</strong>
      </p>
      <button type="button" className="roll-button" onClick={onPlayAgain}>
        Play again
      </button>
    </div>
  )
}
