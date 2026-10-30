import {
  CATEGORIES,
  FIVE_OF_A_KIND_BONUS,
  FIVE_OF_A_KIND_POINTS,
  FULL_HOUSE_POINTS,
  LARGE_STRAIGHT_POINTS,
  MAX_ROLLS,
  SMALL_STRAIGHT_POINTS,
  UPPER_BONUS,
  UPPER_BONUS_THRESHOLD,
} from '../game/rules'
import tables from '../styles/tables.module.css'
import { Dialog } from './Dialog'
import styles from './RulesDialog.module.css'

const LOWER_SECTION = [
  ['Three of a Kind', 'At least three dice the same', 'Total of all dice'],
  ['Four of a Kind', 'At least four dice the same', 'Total of all dice'],
  ['Full House', 'Three of one number and two of another', `${FULL_HOUSE_POINTS}`],
  ['Small Straight', 'Four numbers in a row, such as 2 3 4 5', `${SMALL_STRAIGHT_POINTS}`],
  ['Large Straight', 'Five numbers in a row', `${LARGE_STRAIGHT_POINTS}`],
  ['Five of a Kind', 'All five dice the same', `${FIVE_OF_A_KIND_POINTS}`],
  ['Chance', 'Anything', 'Total of all dice'],
] as const

interface RulesDialogProps {
  onClose: () => void
}

/** How to play, as this app implements the game. */
export function RulesDialog({ onClose }: RulesDialogProps) {
  return (
    <Dialog title="How to play" onClose={onClose}>
      <p>
        A game has {CATEGORIES.length} turns. On your turn, roll the five dice up to {MAX_ROLLS} times. Between
        rolls, click dice to hold them (or press 1 to 5). Then score the dice in one empty box of the scorecard,
        even if that box scores 0. The highest total wins.
      </p>
      <section className={styles.section}>
        <h3>Upper section</h3>
        <p>
          Ones to Sixes: the total of the dice showing that number. With {UPPER_BONUS_THRESHOLD} or more in the
          upper section, you get a bonus of {UPPER_BONUS}.
        </p>
      </section>
      <section className={styles.section}>
        <h3>Lower section</h3>
        <table className={tables.table}>
          <thead>
            <tr>
              <th scope="col">Box</th>
              <th scope="col">Dice</th>
              <th scope="col">Points</th>
            </tr>
          </thead>
          <tbody>
            {LOWER_SECTION.map(([box, dice, points]) => (
              <tr key={box}>
                <th scope="row">{box}</th>
                <td>{dice}</td>
                <td>{points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p>
        Five of the same number is not a Full House. If you have already scored {FIVE_OF_A_KIND_POINTS} for Five of
        a Kind, every extra Five of a Kind earns a bonus of {FIVE_OF_A_KIND_BONUS} (you can turn this off when you
        start a game).
      </p>
      <p className="hint">
        Based on the <a href="https://beesboardsma.com/pages/five-dice">Five Dice rules</a>.
      </p>
    </Dialog>
  )
}
