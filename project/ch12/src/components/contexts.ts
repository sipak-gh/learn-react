import { createContext, type Dispatch } from 'react'
import type { Rng } from '../game/dice'
import type { GameAction, GameState } from '../game/reducer'

// Contexts live in their own .ts file: a file that exports components should
// export only components, so Fast Refresh (HMR) can update them in place.

/** The current game. null means "no <GameProvider> above": a bug we want to catch. */
export const GameStateContext = createContext<GameState | null>(null)

/** The reducer's dispatch function, in a separate context because it never changes. */
export const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null)

/**
 * Where dice rolls come from. The default value is used when no provider is
 * above, so the real app needs no provider at all; tests provide a fake one.
 */
export const RngContext = createContext<Rng>(Math.random)
