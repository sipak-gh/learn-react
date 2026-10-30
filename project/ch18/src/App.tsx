import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Game } from './components/Game'
import { GameProvider } from './components/GameProvider'
import { Leaderboard } from './components/Leaderboard'
import { NewGameForm } from './components/NewGameForm'
import { RulesDialog } from './components/RulesDialog'
import { ThemeSelect } from './components/ThemeSelect'
import { setupOf, type GameState } from './game/reducer'
import { clearSavedGame, loadGame } from './game/storage'
import type { GameSetup } from './game/types'
import buttons from './styles/buttons.module.css'
import styles from './App.module.css'

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
  // Which dialog is open, if any.
  const [dialog, setDialog] = useState<'rules' | 'confirmNewGame' | null>(null)

  // The heading of whichever screen is showing: "New game", or the board's first panel.
  const headingRef = useRef<HTMLHeadingElement>(null)

  /** Swap screens with `update`, then move focus to the new screen's heading. */
  function changeScreen(update: () => void) {
    // The button that was just pressed is about to disappear, which would drop
    // focus to <body>. flushSync puts the new screen on the page right now, so
    // its heading is there to focus.
    flushSync(update)
    headingRef.current?.focus()
  }

  function handleStart(setup: GameSetup) {
    changeScreen(() => setSession({ id: 1, setup }))
  }

  function handlePlayAgain() {
    // Same players and options, new id. The new `key` below makes React throw
    // away the old <GameProvider> and its state, and mount a fresh one.
    changeScreen(() => setSession((current) => current && { id: current.id + 1, setup: current.setup }))
  }

  function handleNewGame() {
    // The player chose to abandon this game: logic for one specific event
    // belongs in its event handler, not in an Effect.
    clearSavedGame()
    changeScreen(() => {
      setSession(null)
      setDialog(null)
    })
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Five Dice</h1>
        <ThemeSelect />
        <button type="button" className={buttons.secondary} onClick={() => setDialog('rules')}>
          Rules
        </button>
        {session && (
          <button type="button" className={buttons.secondary} onClick={() => setDialog('confirmNewGame')}>
            New game
          </button>
        )}
      </header>

      {session ? (
        <GameProvider key={session.id} setup={session.setup} saved={session.saved}>
          <Game onPlayAgain={handlePlayAgain} headingRef={headingRef} />
        </GameProvider>
      ) : (
        <main className={styles.setup}>
          <h2 ref={headingRef} tabIndex={-1}>
            New game
          </h2>
          <NewGameForm onStart={handleStart} />
          <h2>Leaderboard</h2>
          <Leaderboard />
        </main>
      )}

      {dialog === 'rules' && <RulesDialog onClose={() => setDialog(null)} />}
      {dialog === 'confirmNewGame' && (
        <ConfirmDialog
          title="Start a new game?"
          confirmLabel="Start new game"
          onConfirm={handleNewGame}
          onCancel={() => setDialog(null)}
        >
          <p>This game will be lost.</p>
        </ConfirmDialog>
      )}

      <footer className={styles.footer}>
        <p>
          Rules: <a href="https://beesboardsma.com/pages/five-dice">Five Dice</a>
        </p>
      </footer>
    </div>
  )
}

export default App
