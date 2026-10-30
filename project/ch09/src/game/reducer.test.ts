import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './rules'
import { createGame, gameReducer, getPhase, type GameAction, type GameState } from './reducer'
import type { GameSetup } from './types'

// A reducer is a pure function, so testing it needs no React at all:
// build a state, apply actions, check the result.
function play(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state)
}

const rollSixes: GameAction = { type: 'roll', values: [6, 6, 6, 6, 6] }
const solo: GameSetup = { playerNames: ['Ada'], settings: { fiveOfAKindBonus: true } }
const duo: GameSetup = { playerNames: ['Ada', 'Bo'], settings: { fiveOfAKindBonus: false } }

describe('gameReducer', () => {
  it('starts a game ready for the first roll', () => {
    const state = createGame(solo)
    expect(getPhase(state)).toBe('ready')
    expect(state.rollsLeft).toBe(3)
  })

  it('rolls, counts down and must score after three rolls', () => {
    let state = play(createGame(solo), rollSixes)
    expect(getPhase(state)).toBe('rolling')
    state = play(state, rollSixes, rollSixes)
    expect(state.rollsLeft).toBe(0)
    expect(getPhase(state)).toBe('mustScore')
    // A fourth roll is ignored: the very same object comes back.
    expect(play(state, rollSixes)).toBe(state)
  })

  it('keeps held dice when rolling', () => {
    const state = play(
      createGame(solo),
      { type: 'roll', values: [1, 2, 3, 4, 5] },
      { type: 'toggleHold', id: 0 },
      rollSixes,
    )
    expect(state.dice.map((die) => die.value)).toEqual([1, 6, 6, 6, 6])
  })

  it('ignores holding and scoring before the first roll', () => {
    const state = createGame(solo)
    expect(play(state, { type: 'toggleHold', id: 0 })).toBe(state)
    expect(play(state, { type: 'score', category: 'chance' })).toBe(state)
  })

  it('scores the dice and starts a new turn', () => {
    const state = play(createGame(solo), rollSixes, { type: 'toggleHold', id: 1 }, { type: 'score', category: 'fiveOfAKind' })
    expect(state.players[0].sheet.scores.fiveOfAKind).toBe(50)
    expect(state.rollsLeft).toBe(3)
    expect(state.dice.some((die) => die.held)).toBe(false)
  })

  it('ignores scoring a category twice', () => {
    const state = play(createGame(solo), rollSixes, { type: 'score', category: 'sixes' }, rollSixes)
    expect(play(state, { type: 'score', category: 'sixes' })).toBe(state)
  })

  it('ends after 13 turns and can start over', () => {
    let state = createGame(solo)
    for (const category of CATEGORIES) {
      state = play(state, rollSixes, { type: 'score', category })
    }
    expect(getPhase(state)).toBe('gameOver')
    expect(play(state, rollSixes)).toBe(state)
    expect(play(state, { type: 'newGame' })).toEqual(createGame(solo))
  })

  it('passes the turn to the next player and back', () => {
    let state = play(createGame(duo), rollSixes, { type: 'score', category: 'sixes' })
    expect(state.current).toBe(1)
    expect(state.players[0].sheet.scores.sixes).toBe(30)
    state = play(state, rollSixes, { type: 'score', category: 'chance' })
    expect(state.current).toBe(0)
    expect(state.players[1].sheet.scores).toEqual({ chance: 30 })
  })

  it('ends only when every player has filled the card', () => {
    let state = createGame(duo)
    for (const category of CATEGORIES) {
      state = play(state, rollSixes, { type: 'score', category })
      expect(getPhase(state)).not.toBe('gameOver')
      state = play(state, rollSixes, { type: 'score', category })
    }
    expect(getPhase(state)).toBe('gameOver')
    // The bonus rule was off for this game: no +100s.
    expect(state.players[0].sheet.fiveOfAKindBonuses).toBe(0)
  })
})
