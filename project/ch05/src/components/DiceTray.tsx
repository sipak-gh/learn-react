import { MAX_ROLLS } from '../game/rules'
import type { Die as DieModel } from '../game/types'
import { Die } from './Die'

interface DiceTrayProps {
  dice: readonly DieModel[]
  rollsLeft: number
  onRoll: () => void
  onToggleHold: (id: number) => void
}

export function DiceTray({ dice, rollsLeft, onRoll, onToggleHold }: DiceTrayProps) {
  // Derived values: computed from props on every render, never stored.
  const hasRolled = rollsLeft < MAX_ROLLS

  return (
    <div className="dice-area">
      <div className="dice-tray">
        {dice.map((die) => (
          <Die
            key={die.id}
            value={die.value}
            held={die.held}
            // You can only hold dice after the first roll of a turn.
            disabled={!hasRolled}
            onToggle={() => onToggleHold(die.id)}
          />
        ))}
      </div>

      <div className="roll-row">
        <button type="button" className="roll-button" onClick={onRoll} disabled={rollsLeft === 0}>
          Roll
        </button>
        <p>
          {hasRolled ? 'Click a die to hold it. ' : 'Roll to start your turn. '}
          Rolls left: {rollsLeft}
        </p>
      </div>
    </div>
  )
}
