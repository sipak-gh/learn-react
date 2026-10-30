import { describe, expect, it } from 'vitest'
import { validatePlayerNames } from './rules'

describe('validatePlayerNames', () => {
  it.each([
    [['Ada'], null],
    [['Ada', 'Bo', 'Cy', 'Di'], null],
    [[], 'Choose 1 to 4 players.'],
    [['A', 'B', 'C', 'D', 'E'], 'Choose 1 to 4 players.'],
    [['Ada', ''], 'Every player needs a name.'],
    [['x'.repeat(21)], 'Names can be at most 20 characters.'],
    [['Ada', 'ada'], 'Each player needs a different name.'],
  ])('%j → %s', (names, expected) => {
    expect(validatePlayerNames(names)).toBe(expected)
  })
})
