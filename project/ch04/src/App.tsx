import { DiceTray } from './components/DiceTray'
import { Panel } from './components/Panel'
import { Scorecard } from './components/Scorecard'
import type { Die } from './game/types'

// Hard-coded for now. Chapter 5 makes the dice roll.
const DEMO_DICE: Die[] = [
  { id: 0, value: 1, held: false },
  { id: 1, value: 3, held: false },
  { id: 2, value: 4, held: true },
  { id: 3, value: 5, held: false },
  { id: 4, value: 6, held: false },
]

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Five Dice</h1>
      </header>

      <main className="board">
        <Panel title="Dice">
          <DiceTray dice={DEMO_DICE} />
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
