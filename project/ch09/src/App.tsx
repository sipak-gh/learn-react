import { useState } from 'react'
import { Game } from './components/Game'
import { NewGameForm } from './components/NewGameForm'
import type { Rng } from './game/dice'
import type { GameSetup } from './game/types'

interface AppProps {
  /** Where random numbers come from. Tests pass a seeded generator. */
  rng?: Rng
}

function App({ rng = Math.random }: AppProps) {
  // null until the new-game form is submitted.
  const [setup, setSetup] = useState<GameSetup | null>(null)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Five Dice</h1>
        {setup && (
          <button type="button" onClick={() => setSetup(null)}>
            New game
          </button>
        )}
      </header>

      {setup ? (
        <Game setup={setup} rng={rng} />
      ) : (
        <main className="setup">
          <h2>New game</h2>
          <NewGameForm onStart={setSetup} />
        </main>
      )}

      <footer className="app-footer">
        <p>
          Rules: <a href="https://beesboardsma.com/pages/five-dice">Five Dice</a>
        </p>
      </footer>
    </div>
  )
}

export default App
