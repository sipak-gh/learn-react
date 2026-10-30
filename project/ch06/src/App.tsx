import { useState } from 'react'
import { DiceTray } from './components/DiceTray'
import { Panel } from './components/Panel'
import { Scorecard } from './components/Scorecard'
import { applyRoll, createDice, rollDice, toggleHold } from './game/dice'
import { MAX_ROLLS } from './game/rules'
import { createSheet, potentialScores, scoreTurn } from './game/scoring'
import type { Category } from './game/types'

function App() {
  const [dice, setDice] = useState(() => createDice())
  const [rollsLeft, setRollsLeft] = useState(MAX_ROLLS)
  const [sheet, setSheet] = useState(createSheet)

  // Derived state: computed during render from the state above, never stored.
  const hasRolled = rollsLeft < MAX_ROLLS
  const values = dice.map((die) => die.value)
  const potential = hasRolled ? potentialScores(sheet, values) : null

  function handleRoll() {
    const values = rollDice()
    setDice((current) => applyRoll(current, values))
    setRollsLeft((n) => n - 1)
  }

  function handleToggleHold(id: number) {
    setDice((current) => toggleHold(current, id))
  }

  function handleScore(category: Category) {
    // Three related updates in one handler. React batches them into one re-render.
    setSheet(scoreTurn(sheet, category, values))
    setDice(createDice())
    setRollsLeft(MAX_ROLLS)
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
          <Scorecard sheet={sheet} potential={potential} onScore={handleScore} />
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
