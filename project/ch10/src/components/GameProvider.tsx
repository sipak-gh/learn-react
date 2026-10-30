import { useReducer, type ReactNode } from 'react'
import { createGame, gameReducer } from '../game/reducer'
import type { GameSetup } from '../game/types'
import { GameDispatchContext, GameStateContext } from './contexts'

interface GameProviderProps {
  setup: GameSetup
  children: ReactNode
}

/** Owns the game state and shares it with every component below it. */
export function GameProvider({ setup, children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, setup, createGame)

  // React 19: a context object itself is the provider (no more <Context.Provider>).
  return (
    <GameStateContext value={state}>
      <GameDispatchContext value={dispatch}>{children}</GameDispatchContext>
    </GameStateContext>
  )
}
