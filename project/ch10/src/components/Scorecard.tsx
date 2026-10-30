import { useContext } from 'react'
import { getPhase } from '../game/reducer'
import { CATEGORY_LABELS, LOWER_CATEGORIES, UPPER_BONUS_THRESHOLD, UPPER_CATEGORIES } from '../game/rules'
import { potentialScores, totals } from '../game/scoring'
import type { Category } from '../game/types'
import { GameDispatchContext, GameStateContext } from './contexts'

interface ScoreCellProps {
  score: number | undefined
  /** Only set in the current player's column, after a roll. */
  potential: number | undefined
  isCurrent: boolean
  onScore: () => void
}

function ScoreCell({ score, potential, isCurrent, onScore }: ScoreCellProps) {
  let content
  if (score !== undefined) {
    content = score
  } else if (potential !== undefined) {
    content = (
      <button type="button" className="score-button" onClick={onScore}>
        {potential}
      </button>
    )
  }
  return <td className={isCurrent ? 'score current' : 'score'}>{content}</td>
}

/** One column per player; the current player's column is highlighted. */
export function Scorecard() {
  const state = useContext(GameStateContext)
  const dispatch = useContext(GameDispatchContext)
  if (!state || !dispatch) throw new Error('Scorecard must be used inside <GameProvider>')

  const { players } = state
  const phase = getPhase(state)
  const canScore = phase === 'rolling' || phase === 'mustScore'
  const values = state.dice.map((die) => die.value)
  const potential = canScore ? potentialScores(players[state.current].sheet, values) : {}
  const playerTotals = players.map((player) => totals(player.sheet))
  const showBonusRow = playerTotals.some((sums) => sums.fiveOfAKindBonus > 0)
  const isCurrent = (index: number) => phase !== 'gameOver' && index === state.current

  const renderRow = (category: Category) => (
    <tr key={category}>
      <td>{CATEGORY_LABELS[category]}</td>
      {players.map((player, index) => (
        <ScoreCell
          key={player.name}
          score={player.sheet.scores[category]}
          potential={isCurrent(index) ? potential[category] : undefined}
          isCurrent={isCurrent(index)}
          onScore={() => dispatch({ type: 'score', category })}
        />
      ))}
    </tr>
  )

  // A row of computed values (bonus, totals) with one cell per player.
  const renderSumRow = (label: string, cell: (index: number) => string | number, className: string) => (
    <tr className={className}>
      <td>{label}</td>
      {players.map((player, index) => (
        <td key={player.name} className={isCurrent(index) ? 'score current' : 'score'}>
          {cell(index)}
        </td>
      ))}
    </tr>
  )

  return (
    <table className="scorecard">
      <thead>
        <tr>
          <th>Category</th>
          {players.map((player, index) => (
            <th key={player.name} className={isCurrent(index) ? 'score current' : 'score'}>
              {player.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {UPPER_CATEGORIES.map(renderRow)}
        {renderSumRow(
          `Upper bonus (${UPPER_BONUS_THRESHOLD} or more)`,
          (index) => {
            const sums = playerTotals[index]
            return sums.upperBonus > 0 ? sums.upperBonus : `${sums.upper} / ${UPPER_BONUS_THRESHOLD}`
          },
          'subtotal',
        )}
      </tbody>
      <tbody>
        {LOWER_CATEGORIES.map(renderRow)}
        {showBonusRow &&
          renderSumRow('Five of a Kind bonus', (index) => playerTotals[index].fiveOfAKindBonus, 'subtotal')}
      </tbody>
      <tfoot>{renderSumRow('Total', (index) => playerTotals[index].grand, 'total')}</tfoot>
    </table>
  )
}
