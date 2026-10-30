import type { GameState } from './reducer'

// Bump the version whenever GameState changes shape, so an old save is ignored
// instead of crashing the new code.
const SAVED_GAME_KEY = 'five-dice:saved-game:v1'

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(state))
}

/** The saved game, or null if there is none or it can't be read. */
export function loadGame(): GameState | null {
  const json = localStorage.getItem(SAVED_GAME_KEY)
  if (json === null) return null
  try {
    const data: unknown = JSON.parse(json)
    // Anything could be in storage: check the shape before trusting it.
    if (isGameState(data)) return data
  } catch {
    // Not valid JSON: fall through.
  }
  return null
}

export function clearSavedGame(): void {
  localStorage.removeItem(SAVED_GAME_KEY)
}

function isGameState(data: unknown): data is GameState {
  if (typeof data !== 'object' || data === null) return false
  const state = data as Partial<GameState>
  return (
    Array.isArray(state.players) &&
    state.players.length > 0 &&
    Array.isArray(state.dice) &&
    state.dice.length === 5 &&
    typeof state.current === 'number' &&
    typeof state.rollsLeft === 'number' &&
    typeof state.settings === 'object'
  )
}
