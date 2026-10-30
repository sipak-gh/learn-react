import { useContext, useEffect, useEffectEvent, useRef, type Ref } from 'react'
import { rollDice } from '../game/dice'
import { getPhase, type Phase } from '../game/reducer'
import type { Die as DieModel } from '../game/types'
import { Die } from './Die'
import { GameDispatchContext, GameStateContext, RngContext } from './contexts'

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
  const state = useContext(GameStateContext)
  const dispatch = useContext(GameDispatchContext)
  const rng = useContext(RngContext)
  if (!state || !dispatch) throw new Error('DiceTray must be used inside <GameProvider>')

  const phase = getPhase(state)
  const canRoll = phase === 'ready' || phase === 'rolling'

  // An arrow function, not `function roll()`: TypeScript keeps the null check
  // on `dispatch` above for arrow functions, but not for hoisted declarations.
  const roll = () => {
    dispatch({ type: 'roll', values: rollDice(rng) })
    animateRoll(state.dice)
  }

  // A ref holds a value that survives re-renders without causing one.
  // Here: the DOM node of each die, by die id.
  const dieNodes = useRef(new Map<number, HTMLButtonElement>())

  function animateRoll(dice: readonly DieModel[]) {
    // Respect the user's "reduce motion" setting.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    for (const die of dice) {
      if (die.held) continue
      // The Web Animations API: animate a DOM node directly, outside React.
      dieNodes.current.get(die.id)?.animate(TUMBLE, { duration: 400, easing: 'ease-out' })
    }
  }

  // An Effect Event: called from the Effect below, but always sees the
  // latest render's values (phase, canRoll, …) without being a dependency.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
    // Leave typing in form fields alone.
    if (event.target instanceof Element && event.target.closest('input, select, textarea')) return

    if (event.key === ' ') {
      // Space on a focused button already clicks that button.
      if (event.target instanceof HTMLButtonElement) return
      event.preventDefault() // don't scroll the page
      if (canRoll) roll()
    } else if (['1', '2', '3', '4', '5'].includes(event.key) && phase === 'rolling') {
      dispatch({ type: 'toggleHold', id: Number(event.key) - 1 })
    }
  })

  // Subscribe once on mount, unsubscribe on unmount (and in between when
  // Strict Mode mounts twice in development).
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
