import { describe, expect, it } from 'vitest'
import { createSheet, isSheetComplete, potentialScores, scoreCategory, scoreTurn, totals } from './scoring'
import { CATEGORIES } from './rules'
import type { Category, DieValue, ScoreSheet } from './types'

describe('scoreCategory', () => {
  // it.each runs the same test once per row of the table.
  it.each<[Category, DieValue[], number]>([
    ['ones', [1, 1, 2, 3, 1], 3],
    ['threes', [3, 3, 2, 3, 1], 9],
    ['sixes', [1, 2, 3, 4, 5], 0],
    ['threeOfAKind', [4, 4, 4, 2, 1], 15],
    ['threeOfAKind', [4, 4, 4, 4, 1], 17], // four of a kind also has three
    ['threeOfAKind', [4, 4, 3, 3, 1], 0],
    ['fourOfAKind', [5, 5, 5, 5, 2], 22],
    ['fourOfAKind', [5, 5, 5, 2, 2], 0],
    ['fullHouse', [2, 2, 3, 3, 3], 25],
    ['fullHouse', [6, 6, 6, 6, 6], 0], // five of a kind is not "two of another"
    ['fullHouse', [2, 2, 3, 3, 4], 0],
    ['smallStraight', [1, 2, 3, 4, 6], 30],
    ['smallStraight', [6, 5, 3, 4, 3], 30], // order doesn't matter
    ['smallStraight', [1, 2, 3, 4, 5], 30], // a large straight contains a small one
    ['smallStraight', [1, 2, 3, 5, 6], 0],
    ['largeStraight', [2, 3, 4, 5, 6], 40],
    ['largeStraight', [1, 2, 3, 4, 6], 0],
    ['fiveOfAKind', [3, 3, 3, 3, 3], 50],
    ['fiveOfAKind', [3, 3, 3, 3, 2], 0],
    ['chance', [1, 2, 3, 4, 6], 16],
  ])('%s with %j scores %i', (category, values, expected) => {
    expect(scoreCategory(category, values)).toBe(expected)
  })
})

describe('scoreTurn', () => {
  it('records the score without changing the old sheet', () => {
    const sheet = createSheet()
    const next = scoreTurn(sheet, 'chance', [1, 2, 3, 4, 5])
    expect(next.scores.chance).toBe(15)
    expect(sheet.scores).toEqual({})
  })

  it('allows scoring 0 in a category that does not match', () => {
    expect(scoreTurn(createSheet(), 'largeStraight', [1, 1, 1, 1, 1]).scores.largeStraight).toBe(0)
  })

  it('refuses to score the same category twice', () => {
    const sheet = scoreTurn(createSheet(), 'ones', [1, 1, 1, 2, 3])
    expect(() => scoreTurn(sheet, 'ones', [1, 1, 1, 1, 1])).toThrow('already been scored')
  })

  describe('Five of a Kind bonus', () => {
    const withFifty: ScoreSheet = { scores: { fiveOfAKind: 50 }, fiveOfAKindBonuses: 0 }
    const withZero: ScoreSheet = { scores: { fiveOfAKind: 0 }, fiveOfAKindBonuses: 0 }

    it('is earned by another Five of a Kind after scoring 50', () => {
      expect(scoreTurn(withFifty, 'sixes', [6, 6, 6, 6, 6]).fiveOfAKindBonuses).toBe(1)
    })

    it('is not earned if Five of a Kind was scored as 0', () => {
      expect(scoreTurn(withZero, 'sixes', [6, 6, 6, 6, 6]).fiveOfAKindBonuses).toBe(0)
    })

    it('is not earned when the optional rule is off', () => {
      expect(scoreTurn(withFifty, 'sixes', [6, 6, 6, 6, 6], false).fiveOfAKindBonuses).toBe(0)
    })
  })
})

describe('potentialScores', () => {
  it('lists only the categories that are still open', () => {
    const sheet = scoreTurn(createSheet(), 'chance', [1, 1, 1, 1, 1])
    const potential = potentialScores(sheet, [2, 2, 2, 3, 3])
    expect(potential.chance).toBeUndefined()
    expect(potential).toMatchObject({ twos: 6, threes: 6, fullHouse: 25, threeOfAKind: 12 })
    expect(Object.keys(potential)).toHaveLength(12)
  })
})

describe('totals', () => {
  it('adds the 35 point bonus at exactly 63 in the upper section', () => {
    // Three of each face is exactly 63: 3 + 6 + 9 + 12 + 15 + 18.
    const sheet: ScoreSheet = {
      scores: { ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18, chance: 20 },
      fiveOfAKindBonuses: 1,
    }
    expect(totals(sheet)).toEqual({
      upper: 63,
      upperBonus: 35,
      lower: 20,
      fiveOfAKindBonus: 100,
      grand: 218,
    })
  })

  it('gives no upper bonus at 62', () => {
    expect(totals({ scores: { sixes: 30, fives: 25, twos: 4, ones: 3 }, fiveOfAKindBonuses: 0 }).upperBonus).toBe(0)
  })
})

describe('isSheetComplete', () => {
  it('is true only when all 13 categories are filled', () => {
    let sheet = createSheet()
    for (const category of CATEGORIES) {
      expect(isSheetComplete(sheet)).toBe(false)
      sheet = scoreTurn(sheet, category, [1, 2, 3, 4, 5])
    }
    expect(isSheetComplete(sheet)).toBe(true)
  })
})
