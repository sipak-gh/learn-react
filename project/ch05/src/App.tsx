import { useState } from 'react'
import { DiceTray } from './components/DiceTray'
import { Panel } from './components/Panel'
import { Scorecard } from './components/Scorecard'
import { applyRoll, createDice, rollDice, toggleHold } from './game/dice'
import { MAX_ROLLS } from './game/rules'

function App() {
  // Pass a function to useState so createDice() runs only on the first render.
  const [dice, setDice] = useState(() => createDice())
  const [rollsLeft, setRollsLeft] = useState(MAX_ROLLS)

  function handleRoll() {
    // Randomness belongs in event handlers, never inside an updater function:
    // React may call updaters twice (Strict Mode) and they must be pure.
    const values = rollDice()
    setDice((current) => applyRoll(current, values))
    setRollsLeft((n) => n - 1)
  }

  function handleToggleHold(id: number) {
    setDice((current) => toggleHold(current, id))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Five Dice</h1>
      </header>

      <main className="board">
        <Panel title="Dice">
          <DiceTray
            dice={dice}
            rollsLeft={rollsLeft}
            onRoll={handleRoll}
            onToggleHold={handleToggleHold}
          />
        </Panel>

        <Panel title="Scorecard">
          <Scorecard />
        </Panel>
      </main>

      <footer className="app-footer">
        <p>
          Rules: <a href="https://beesboardsma.com/pages/five-dice">Five Dice</a>
        </p>
      </footer>
    </div>
  )
}

export default App
