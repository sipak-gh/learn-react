import { useState } from 'react'
import { Game } from './components/Game'
import { GameProvider } from './components/GameProvider'
import { NewGameForm } from './components/NewGameForm'
import type { GameSetup } from './game/types'

/** One game from start to finish. A new id means a brand-new game. */
interface Session {
  id: number
  setup: GameSetup
}

function App() {
  // null until the new-game form is submitted.
  const [session, setSession] = useState<Session | null>(null)

  function handlePlayAgain() {
    // Same players and options, new id. The new `key` below makes React throw
    // away the old <GameProvider> and its state, and mount a fresh one.
    setSession((current) => current && { id: current.id + 1, setup: current.setup })
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Five Dice</h1>
        {session && (
          <button type="button" onClick={() => setSession(null)}>
            New game
          </button>
        )}
      </header>

      {session ? (
        <GameProvider key={session.id} setup={session.setup}>
          <Game onPlayAgain={handlePlayAgain} />
        </GameProvider>
      ) : (
        <main className="setup">
          <h2>New game</h2>
          <NewGameForm onStart={(setup) => setSession({ id: 1, setup })} />
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
