import { afterEach, describe, expect, it } from 'vitest'
import { createGame } from './reducer'
import { clearSavedGame, loadGame, saveGame } from './storage'

describe('storage', () => {
  afterEach(() => localStorage.clear())

  it('saves and loads a game', () => {
    const game = createGame({ playerNames: ['Ada'], settings: { fiveOfAKindBonus: true } })
    saveGame(game)
    expect(loadGame()).toEqual(game)
    clearSavedGame()
    expect(loadGame()).toBeNull()
  })

  it('ignores data it cannot use', () => {
    localStorage.setItem('five-dice:saved-game:v1', '{ not json')
    expect(loadGame()).toBeNull()
    localStorage.setItem('five-dice:saved-game:v1', '{"players": []}')
    expect(loadGame()).toBeNull()
  })
})
