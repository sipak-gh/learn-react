import type { Category, LowerCategory, UpperCategory } from './types'

/** Rolls allowed per turn. */
export const MAX_ROLLS = 3

export const UPPER_CATEGORIES: readonly UpperCategory[] = [
  'ones',
  'twos',
  'threes',
  'fours',
  'fives',
  'sixes',
]

export const LOWER_CATEGORIES: readonly LowerCategory[] = [
  'threeOfAKind',
  'fourOfAKind',
  'fullHouse',
  'smallStraight',
  'largeStraight',
  'fiveOfAKind',
  'chance',
]

/** Display names. `Record<Category, string>` makes the compiler check that no category is missing. */
export const CATEGORY_LABELS: Record<Category, string> = {
  ones: 'Ones',
  twos: 'Twos',
  threes: 'Threes',
  fours: 'Fours',
  fives: 'Fives',
  sixes: 'Sixes',
  threeOfAKind: 'Three of a Kind',
  fourOfAKind: 'Four of a Kind',
  fullHouse: 'Full House',
  smallStraight: 'Small Straight',
  largeStraight: 'Large Straight',
  fiveOfAKind: 'Five of a Kind',
  chance: 'Chance',
}

/** All 13 categories, top to bottom. One turn fills one category, so a game is 13 turns. */
export const CATEGORIES: readonly Category[] = [...UPPER_CATEGORIES, ...LOWER_CATEGORIES]

export const UPPER_BONUS_THRESHOLD = 63
export const UPPER_BONUS = 35
export const FULL_HOUSE_POINTS = 25
export const SMALL_STRAIGHT_POINTS = 30
export const LARGE_STRAIGHT_POINTS = 40
export const FIVE_OF_A_KIND_POINTS = 50
/** Optional rule: each extra Five of a Kind after scoring 50 in that box. */
export const FIVE_OF_A_KIND_BONUS = 100

export const MIN_PLAYERS = 1
export const MAX_PLAYERS = 4
export const MAX_NAME_LENGTH = 20

/** Check the names typed into the new-game form. Returns an error message, or null if they are fine. */
export function validatePlayerNames(names: readonly string[]): string | null {
  if (names.length < MIN_PLAYERS || names.length > MAX_PLAYERS) {
    return `Choose ${MIN_PLAYERS} to ${MAX_PLAYERS} players.`
  }
  if (names.some((name) => name === '')) {
    return 'Every player needs a name.'
  }
  if (names.some((name) => name.length > MAX_NAME_LENGTH)) {
    return `Names can be at most ${MAX_NAME_LENGTH} characters.`
  }
  const unique = new Set(names.map((name) => name.toLowerCase()))
  if (unique.size !== names.length) {
    return 'Each player needs a different name.'
  }
  return null
}
