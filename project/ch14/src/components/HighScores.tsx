import { useHighScores } from '../hooks/useHighScores'
import tables from '../styles/tables.module.css'

export function HighScores() {
  const { highScores } = useHighScores()

  if (highScores.length === 0) {
    return <p className="hint">No high scores yet. Finish a game to get on the board!</p>
  }

  return (
    <table className={tables.table}>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th className={tables.number}>Score</th>
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
            <td className={tables.number}>{entry.score}</td>
            <td>{entry.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
