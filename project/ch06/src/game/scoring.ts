import {
  CATEGORIES,
  FIVE_OF_A_KIND_BONUS,
  FIVE_OF_A_KIND_POINTS,
  FULL_HOUSE_POINTS,
  LARGE_STRAIGHT_POINTS,
  LOWER_CATEGORIES,
  SMALL_STRAIGHT_POINTS,
  UPPER_BONUS,
  UPPER_BONUS_THRESHOLD,
  UPPER_CATEGORIES,
} from './rules'
import type { Category, DieValue, Scores, ScoreSheet, UpperCategory } from './types'

const FACE: Record<UpperCategory, DieValue> = {
  ones: 1,
  twos: 2,
  threes: 3,
  fours: 4,
  fives: 5,
  sixes: 6,
}

/** counts[face] = how many dice show that face. Index 0 is unused. */
function countFaces(values: readonly DieValue[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const value of values) counts[value]++
  return counts
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

/** Length of the longest run of consecutive faces, e.g. 2-3-4-5 → 4. */
function longestRun(counts: readonly number[]): number {
  let longest = 0
  let run = 0
  for (let face = 1; face <= 6; face++) {
    run = counts[face] > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  return longest
}

export function isFiveOfAKind(values: readonly DieValue[]): boolean {
  return values.length === 5 && values.every((value) => value === values[0])
}

/** The points these dice would score in `category`. 0 if the pattern is missing. */
export function scoreCategory(category: Category, values: readonly DieValue[]): number {
  const counts = countFaces(values)
  const most = Math.max(...counts)

  switch (category) {
    case 'ones':
    case 'twos':
    case 'threes':
    case 'fours':
    case 'fives':
    case 'sixes':
      return counts[FACE[category]] * FACE[category]
    case 'threeOfAKind':
      return most >= 3 ? sum(values) : 0
    case 'fourOfAKind':
      return most >= 4 ? sum(values) : 0
    case 'fullHouse':
      // "Three of one number and two of another": five of a kind does not count.
      return counts.includes(3) && counts.includes(2) ? FULL_HOUSE_POINTS : 0
    case 'smallStraight':
      return longestRun(counts) >= 4 ? SMALL_STRAIGHT_POINTS : 0
    case 'largeStraight':
      return longestRun(counts) === 5 ? LARGE_STRAIGHT_POINTS : 0
    case 'fiveOfAKind':
      return most === 5 ? FIVE_OF_A_KIND_POINTS : 0
    case 'chance':
      return sum(values)
  }
}

export function createSheet(): ScoreSheet {
  return { scores: {}, fiveOfAKindBonuses: 0 }
}

/**
 * Record the score for `category` and return a new sheet.
 * With `bonusRule` on, rolling another Five of a Kind after already scoring
 * 50 in that box earns a +100 bonus, whichever category you score it in.
 */
export function scoreTurn(
  sheet: ScoreSheet,
  category: Category,
  values: readonly DieValue[],
  bonusRule = true,
): ScoreSheet {
  if (sheet.scores[category] !== undefined) {
    throw new Error(`${category} has already been scored`)
  }
  const earnsBonus =
    bonusRule && isFiveOfAKind(values) && sheet.scores.fiveOfAKind === FIVE_OF_A_KIND_POINTS
  return {
    scores: { ...sheet.scores, [category]: scoreCategory(category, values) },
    fiveOfAKindBonuses: sheet.fiveOfAKindBonuses + (earnsBonus ? 1 : 0),
  }
}

export interface Totals {
  upper: number
  upperBonus: number
  lower: number
  fiveOfAKindBonus: number
  grand: number
}

export function totals(sheet: ScoreSheet): Totals {
  const add = (categories: readonly Category[]) =>
    sum(categories.map((category) => sheet.scores[category] ?? 0))
  const upper = add(UPPER_CATEGORIES)
  const upperBonus = upper >= UPPER_BONUS_THRESHOLD ? UPPER_BONUS : 0
  const lower = add(LOWER_CATEGORIES)
  const fiveOfAKindBonus = sheet.fiveOfAKindBonuses * FIVE_OF_A_KIND_BONUS
  return { upper, upperBonus, lower, fiveOfAKindBonus, grand: upper + upperBonus + lower + fiveOfAKindBonus }
}

export function isSheetComplete(sheet: ScoreSheet): boolean {
  return CATEGORIES.every((category) => sheet.scores[category] !== undefined)
}

/** What each still-open category would score with these dice. Used ones are left out. */
export function potentialScores(sheet: ScoreSheet, values: readonly DieValue[]): Scores {
  const result: Scores = {}
  for (const category of CATEGORIES) {
    if (sheet.scores[category] === undefined) {
      result[category] = scoreCategory(category, values)
    }
  }
  return result
}
