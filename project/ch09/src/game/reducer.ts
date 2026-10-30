import { applyRoll, createDice, toggleHold } from './dice'
import { MAX_ROLLS } from './rules'
import { createSheet, isSheetComplete, scoreTurn } from './scoring'
import type { Category, Die, DieValue, GameSetup, Player, Settings } from './types'

export interface GameState {
  players: Player[]
  /** Index into `players` of whoever's turn it is. */
  current: number
  dice: Die[]
  rollsLeft: number
  settings: Settings
}

/**
 * Every way the game can change, as a discriminated union: the `type` field
 * tells TypeScript which other fields exist.
 */
export type GameAction =
  // The random values come in with the action, so the reducer stays pure.
  | { type: 'roll'; values: DieValue[] }
  | { type: 'toggleHold'; id: number }
  | { type: 'score'; category: Category }
  | { type: 'newGame' }

/**
 * The game is a small state machine. The phase is derived from the state,
 * never stored, so it can't get out of sync.
 * - ready:     a new turn; you must roll before anything else
 * - rolling:   rolled at least once, rolls left; hold dice, roll again or score
 * - mustScore: no rolls left; pick a category
 * - gameOver:  every player has filled all 13 categories
 */
export type Phase = 'ready' | 'rolling' | 'mustScore' | 'gameOver'

export function getPhase(state: GameState): Phase {
  if (state.players.every((player) => isSheetComplete(player.sheet))) return 'gameOver'
  if (state.rollsLeft === MAX_ROLLS) return 'ready'
  if (state.rollsLeft === 0) return 'mustScore'
  return 'rolling'
}

export function createGame(setup: GameSetup): GameState {
  return {
    players: setup.playerNames.map((name) => ({ name, sheet: createSheet() })),
    current: 0,
    dice: createDice(),
    rollsLeft: MAX_ROLLS,
    settings: setup.settings,
  }
}

/** The setup a game was started with, to start another one like it. */
export function setupOf(state: GameState): GameSetup {
  return { playerNames: state.players.map((player) => player.name), settings: state.settings }
}

/**
 * (state, action) => next state. Pure: no randomness, no mutation, no side
 * effects. Actions that make no sense in the current phase are ignored by
 * returning the same state object, which tells React nothing changed.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  const phase = getPhase(state)

  switch (action.type) {
    case 'roll': {
      if (phase !== 'ready' && phase !== 'rolling') return state
      return { ...state, dice: applyRoll(state.dice, action.values), rollsLeft: state.rollsLeft - 1 }
    }
    case 'toggleHold': {
      if (phase !== 'rolling') return state
      return { ...state, dice: toggleHold(state.dice, action.id) }
    }
    case 'score': {
      if (phase !== 'rolling' && phase !== 'mustScore') return state
      const player = state.players[state.current]
      if (player.sheet.scores[action.category] !== undefined) return state
      const values = state.dice.map((die) => die.value)
      const sheet = scoreTurn(player.sheet, action.category, values, state.settings.fiveOfAKindBonus)
      return {
        ...state,
        // Array.prototype.with: a copy of the array with one element replaced.
        players: state.players.with(state.current, { ...player, sheet }),
        // Next player's turn, wrapping around to the first.
        current: (state.current + 1) % state.players.length,
        dice: createDice(),
        rollsLeft: MAX_ROLLS,
      }
    }
    case 'newGame':
      return createGame(setupOf(state))
    default: {
      // If a new action type is added but not handled above, this line stops compiling.
      const unhandled: never = action
      return unhandled
    }
  }
}
