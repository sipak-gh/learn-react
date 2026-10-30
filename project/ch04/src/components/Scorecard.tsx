import { CATEGORY_LABELS, LOWER_CATEGORIES, UPPER_CATEGORIES } from '../game/rules'
import type { Category } from '../game/types'

function CategoryRow({ category }: { category: Category }) {
  return (
    <tr>
      <td>{CATEGORY_LABELS[category]}</td>
      <td className="score"></td>
    </tr>
  )
}

export function Scorecard() {
  return (
    <table className="scorecard">
      <thead>
        <tr>
          <th>Category</th>
          <th className="score">Score</th>
        </tr>
      </thead>
      <tbody>
        {UPPER_CATEGORIES.map((category) => (
          <CategoryRow key={category} category={category} />
        ))}
        <tr className="subtotal">
          <td>Upper bonus (63 or more)</td>
          <td className="score"></td>
        </tr>
      </tbody>
      <tbody>
        {LOWER_CATEGORIES.map((category) => (
          <CategoryRow key={category} category={category} />
        ))}
      </tbody>
      <tfoot>
        <tr className="total">
          <td>Total</td>
          <td className="score">0</td>
        </tr>
      </tfoot>
    </table>
  )
}
