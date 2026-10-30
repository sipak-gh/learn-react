import { useContext } from 'react'
import { rollDice } from '../game/dice'
import { getPhase, type Phase } from '../game/reducer'
import { Die } from './Die'
import { GameDispatchContext, GameStateContext, RngContext } from './contexts'

const HINTS: Record<Phase, string> = {
  ready: 'Roll to start your turn.',
  rolling: 'Click a die to hold it, roll again, or pick a score.',
  mustScore: 'No rolls left: pick a score.',
  gameOver: 'Game over.',
}

export function DiceTray() {
  // No props: everything comes from context.
  const state = useContext(GameStateContext)
  const dispatch = useContext(GameDispatchContext)
  const rng = useContext(RngContext)
  if (!state || !dispatch) throw new Error('DiceTray must be used inside <GameProvider>')

  const phase = getPhase(state)
  const canRoll = phase === 'ready' || phase === 'rolling'

  return (
    <div className="dice-area">
      <div className="dice-tray">
        {state.dice.map((die) => (
          <Die
            key={die.id}
            value={die.value}
            held={die.held}
            disabled={phase !== 'rolling'}
            onToggle={() => dispatch({ type: 'toggleHold', id: die.id })}
          />
        ))}
      </div>

      <div className="roll-row">
        <button
          type="button"
          className="roll-button"
          onClick={() => dispatch({ type: 'roll', values: rollDice(rng) })}
          disabled={!canRoll}
        >
          Roll
        </button>
        <p>
          {HINTS[phase]} Rolls left: {state.rollsLeft}
        </p>
      </div>
    </div>
  )
}
