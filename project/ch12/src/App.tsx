import { useState } from 'react'
import { Game } from './components/Game'
import { GameProvider } from './components/GameProvider'
import { NewGameForm } from './components/NewGameForm'
import { setupOf, type GameState } from './game/reducer'
import { clearSavedGame, loadGame } from './game/storage'
import type { GameSetup } from './game/types'

/** One game from start to finish. A new id means a brand-new game. */
interface Session {
  id: number
  setup: GameSetup
  /** Set when continuing a game saved in localStorage. */
  saved?: GameState
}

/** Continue the saved game, if there is one. */
function resumeSession(): Session | null {
  const saved = loadGame()
  return saved ? { id: 1, setup: setupOf(saved), saved } : null
}

function App() {
  // null shows the new-game form. The initializer function reads localStorage
  // once, on the first render, instead of on every render.
  const [session, setSession] = useState(resumeSession)

  function handlePlayAgain() {
    // Same players and options, new id. The new `key` below makes React throw
    // away the old <GameProvider> and its state, and mount a fresh one.
    setSession((current) => current && { id: current.id + 1, setup: current.setup })
  }

  function handleNewGame() {
    // The player chose to abandon this game: logic for one specific event
    // belongs in its event handler, not in an Effect.
    clearSavedGame()
    setSession(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Five Dice</h1>
        {session && (
          <button type="button" onClick={handleNewGame}>
            New game
          </button>
        )}
      </header>

      {session ? (
        <GameProvider key={session.id} setup={session.setup} saved={session.saved}>
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
