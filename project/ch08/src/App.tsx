import { useReducer } from 'react'
import { DiceTray } from './components/DiceTray'
import { GameOver } from './components/GameOver'
import { Panel } from './components/Panel'
import { Scorecard } from './components/Scorecard'
import { rollDice, type Rng } from './game/dice'
import { createGame, gameReducer, getPhase } from './game/reducer'
import { potentialScores, totals } from './game/scoring'
import type { Category } from './game/types'

interface AppProps {
  /** Where random numbers come from. Tests pass a seeded generator. */
  rng?: Rng
}

function App({ rng = Math.random }: AppProps) {
  // The third argument is an initializer: React calls createGame() once to build the first state.
  const [state, dispatch] = useReducer(gameReducer, undefined, createGame)

  const phase = getPhase(state)
  const values = state.dice.map((die) => die.value)
  const canScore = phase === 'rolling' || phase === 'mustScore'
  const potential = canScore ? potentialScores(state.sheet, values) : null

  function handleRoll() {
    // Event handlers may be impure: roll here, then describe what happened.
    dispatch({ type: 'roll', values: rollDice(rng) })
  }

  function handleScore(category: Category) {
    dispatch({ type: 'score', category })
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Five Dice</h1>
      </header>

      <main className="board">
        <Panel title="Dice">
          {phase === 'gameOver' ? (
            <GameOver
              total={totals(state.sheet).grand}
              onPlayAgain={() => dispatch({ type: 'newGame' })}
            />
          ) : (
            <DiceTray
              dice={state.dice}
              rollsLeft={state.rollsLeft}
              phase={phase}
              onRoll={handleRoll}
              onToggleHold={(id) => dispatch({ type: 'toggleHold', id })}
            />
          )}
        </Panel>

        <Panel title="Scorecard">
          <Scorecard sheet={state.sheet} potential={potential} onScore={handleScore} />
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
