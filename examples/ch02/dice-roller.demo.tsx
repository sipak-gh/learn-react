import { useState } from 'react'

// A preview of Chapters 4 and 5: the same dice roller as a React component.
const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
const MAX_ROLLS = 3

export default function DiceRoller() {
  // The state: React keeps it between renders.
  const [values, setValues] = useState([1, 1, 1, 1, 1])
  const [held, setHeld] = useState([false, false, false, false, false])
  const [rollsLeft, setRollsLeft] = useState(MAX_ROLLS)

  // Everything else is computed from the state on every render.
  const hasRolled = rollsLeft < MAX_ROLLS
  let status = `Rolls left: ${rollsLeft}`
  if (!hasRolled) status = 'Roll to start.'
  else if (rollsLeft === 0) status = 'No rolls left.'

  function roll() {
    setValues(values.map((value, i) => (held[i] ? value : Math.floor(Math.random() * 6) + 1)))
    setRollsLeft(rollsLeft - 1)
  }

  function newTurn() {
    setHeld([false, false, false, false, false])
    setRollsLeft(MAX_ROLLS)
  }

  // The whole UI, described for the current state. React patches the DOM to match.
  return (
    <main>
      <h1>Dice roller (React)</h1>
      <div>
        {values.map((value, i) => (
          <button
            key={i}
            type="button"
            disabled={!hasRolled}
            aria-pressed={held[i]}
            aria-label={`Die showing ${value}`}
            style={{ fontSize: '3rem', background: held[i] ? '#ffe8a3' : 'white' }}
            onClick={() => setHeld(held.with(i, !held[i]))}
          >
            {FACES[value - 1]}
          </button>
        ))}
      </div>
      <p>{status}</p>
      <button type="button" disabled={rollsLeft === 0} onClick={roll}>
        Roll
      </button>{' '}
      <button type="button" onClick={newTurn}>
        New turn
      </button>
    </main>
  )
}
