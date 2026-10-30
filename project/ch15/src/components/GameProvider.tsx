import { useEffect, useReducer, type ReactNode } from 'react'
import { createGame, gameReducer, getPhase, type GameState } from '../game/reducer'
import { clearSavedGame, saveGame } from '../game/storage'
import type { GameSetup } from '../game/types'
import { GameDispatchContext, GameStateContext } from './contexts'

interface GameProviderProps {
  setup: GameSetup
  /** A saved game to continue instead of starting a new one. */
  saved?: GameState
  children: ReactNode
}

/** Owns the game state and shares it with every component below it. */
export function GameProvider({ setup, saved, children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, null, () => saved ?? createGame(setup))

  // Keep localStorage in sync with the game: an external system, so an Effect.
  // It runs after every render where `state` changed.
  useEffect(() => {
    if (getPhase(state) === 'gameOver') {
      clearSavedGame() // nothing left to resume
    } else {
      saveGame(state)
    }
  }, [state])

  // React 19: a context object itself is the provider (no more <Context.Provider>).
  return (
    <GameStateContext value={state}>
      <GameDispatchContext value={dispatch}>{children}</GameDispatchContext>
    </GameStateContext>
  )
}
