import { useHighScores } from '../hooks/useHighScores'

export function HighScores() {
  const { highScores } = useHighScores()

  if (highScores.length === 0) {
    return <p className="hint">No high scores yet. Finish a game to get on the board!</p>
  }

  return (
    <table className="high-scores">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th className="score">Score</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {highScores.map((entry, index) => (
          // Entries have no id, and names and scores can repeat. The table is
          // only ever replaced as a whole, so the position is a fine key here.
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{entry.name}</td>
            <td className="score">{entry.score}</td>
            <td>{entry.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
