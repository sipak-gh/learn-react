import { useContext, useRef, type Ref } from 'react'
import { rollDice } from '../game/dice'
import { getPhase, type Phase } from '../game/reducer'
import type { Die as DieModel } from '../game/types'
import { useGameDispatch, useGameState } from '../hooks/useGame'
import { useKeyboardShortcuts, type Shortcuts } from '../hooks/useKeyboardShortcuts'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { Die } from './Die'
import { RngContext } from './contexts'

const HINTS: Record<Phase, string> = {
  ready: 'Roll to start your turn.',
  rolling: 'Click a die to hold it, roll again, or pick a score.',
  mustScore: 'No rolls left: pick a score.',
  gameOver: 'Game over.',
}

const TUMBLE: Keyframe[] = [
  { transform: 'rotate(0) scale(1)' },
  { transform: 'rotate(200deg) scale(0.8)' },
  { transform: 'rotate(360deg) scale(1)' },
]

interface DiceTrayProps {
  /** Lets the parent reach the Roll button, to move focus to it. */
  rollButtonRef?: Ref<HTMLButtonElement>
}

export function DiceTray({ rollButtonRef }: DiceTrayProps) {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const rng = useContext(RngContext)
  const reducedMotion = usePrefersReducedMotion()

  const phase = getPhase(state)
  const canRoll = phase === 'ready' || phase === 'rolling'

  function roll() {
    dispatch({ type: 'roll', values: rollDice(rng) })
    animateRoll(state.dice)
  }

  // A ref holds a value that survives re-renders without causing one.
  // Here: the DOM node of each die, by die id.
  const dieNodes = useRef(new Map<number, HTMLButtonElement>())

  function animateRoll(dice: readonly DieModel[]) {
    // Respect the user's "reduce motion" setting.
    if (reducedMotion) return
    for (const die of dice) {
      if (die.held) continue
      // The Web Animations API: animate a DOM node directly, outside React.
      dieNodes.current.get(die.id)?.animate(TUMBLE, { duration: 400, easing: 'ease-out' })
    }
  }

  function toggleHold(id: number) {
    if (phase === 'rolling') dispatch({ type: 'toggleHold', id })
  }

  // Space rolls; keys 1–5 hold the matching die.
  const shortcuts: Shortcuts = {
    Space: () => {
      if (canRoll) roll()
    },
  }
  for (const die of state.dice) {
    shortcuts[String(die.id + 1)] = () => toggleHold(die.id)
  }
  useKeyboardShortcuts(shortcuts)

  return (
    <div className="dice-area">
      <div className="dice-tray">
        {state.dice.map((die) => (
          <Die
            key={die.id}
            value={die.value}
            held={die.held}
            disabled={phase !== 'rolling'}
            onToggle={() => toggleHold(die.id)}
            // A ref callback: React calls it with the node after mounting,
            // and calls the returned cleanup function before removing it.
            ref={(node) => {
              if (!node) return
              dieNodes.current.set(die.id, node)
              return () => {
                dieNodes.current.delete(die.id)
              }
            }}
          />
        ))}
      </div>

      <div className="roll-row">
        <button
          ref={rollButtonRef}
          type="button"
          className="roll-button"
          onClick={roll}
          disabled={!canRoll}
        >
          Roll
        </button>
        <p>
          {HINTS[phase]} Rolls left: {state.rollsLeft}
        </p>
      </div>
      <p className="hint">Keyboard: Space rolls, 1–5 hold dice.</p>
    </div>
  )
}
