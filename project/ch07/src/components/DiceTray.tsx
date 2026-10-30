import type { Phase } from '../game/reducer'
import type { Die as DieModel } from '../game/types'
import { Die } from './Die'

interface DiceTrayProps {
  dice: readonly DieModel[]
  rollsLeft: number
  phase: Phase
  onRoll: () => void
  onToggleHold: (id: number) => void
}

const HINTS: Record<Phase, string> = {
  ready: 'Roll to start your turn.',
  rolling: 'Click a die to hold it, roll again, or pick a score.',
  mustScore: 'No rolls left: pick a score.',
  gameOver: 'Game over.',
}

export function DiceTray({ dice, rollsLeft, phase, onRoll, onToggleHold }: DiceTrayProps) {
  const canRoll = phase === 'ready' || phase === 'rolling'

  return (
    <div className="dice-area">
      <div className="dice-tray">
        {dice.map((die) => (
          <Die
            key={die.id}
            value={die.value}
            held={die.held}
            disabled={phase !== 'rolling'}
            onToggle={() => onToggleHold(die.id)}
          />
        ))}
      </div>

      <div className="roll-row">
        <button type="button" className="roll-button" onClick={onRoll} disabled={!canRoll}>
          Roll
        </button>
        <p>
          {HINTS[phase]} Rolls left: {rollsLeft}
        </p>
      </div>
    </div>
  )
}
