import { CATEGORY_LABELS, LOWER_CATEGORIES, UPPER_BONUS_THRESHOLD, UPPER_CATEGORIES } from '../game/rules'
import { totals } from '../game/scoring'
import type { Category, Scores, ScoreSheet } from '../game/types'

interface ScorecardProps {
  sheet: ScoreSheet
  /** What each open category would score with the current dice, or null before the first roll. */
  potential: Scores | null
  onScore: (category: Category) => void
}

interface CategoryRowProps {
  category: Category
  score: number | undefined
  potential: number | null
  onScore: (category: Category) => void
}

function CategoryRow({ category, score, potential, onScore }: CategoryRowProps) {
  // Three possible cells: an existing score, a button to score now, or nothing.
  let cell
  if (score !== undefined) {
    cell = score
  } else if (potential !== null) {
    cell = (
      <button type="button" className="score-button" onClick={() => onScore(category)}>
        {potential}
      </button>
    )
  }

  return (
    <tr>
      <td>{CATEGORY_LABELS[category]}</td>
      <td className="score">{cell}</td>
    </tr>
  )
}

export function Scorecard({ sheet, potential, onScore }: ScorecardProps) {
  const sums = totals(sheet)

  function renderRow(category: Category) {
    return (
      <CategoryRow
        key={category}
        category={category}
        score={sheet.scores[category]}
        potential={potential?.[category] ?? null}
        onScore={onScore}
      />
    )
  }

  return (
    <table className="scorecard">
      <thead>
        <tr>
          <th>Category</th>
          <th className="score">Score</th>
        </tr>
      </thead>
      <tbody>
        {UPPER_CATEGORIES.map(renderRow)}
        <tr className="subtotal">
          <td>Upper bonus ({UPPER_BONUS_THRESHOLD} or more)</td>
          <td className="score">
            {sums.upperBonus > 0 ? sums.upperBonus : `${sums.upper} / ${UPPER_BONUS_THRESHOLD}`}
          </td>
        </tr>
      </tbody>
      <tbody>
        {LOWER_CATEGORIES.map(renderRow)}
        {sums.fiveOfAKindBonus > 0 && (
          <tr className="subtotal">
            <td>Five of a Kind bonus</td>
            <td className="score">{sums.fiveOfAKindBonus}</td>
          </tr>
        )}
      </tbody>
      <tfoot>
        <tr className="total">
          <td>Total</td>
          <td className="score">{sums.grand}</td>
        </tr>
      </tfoot>
    </table>
  )
}
