/** A face of a six-sided die. A union of literal types: 0 or 7 won't compile. */
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6

/** One die on the table. */
export interface Die {
  /** Stable identity for the whole game (position 0–4). */
  id: number
  value: DieValue
  /** A held die is kept: the next roll leaves it alone. */
  held: boolean
}

/** The six upper-section categories: score the sum of one face. */
export type UpperCategory = 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'

/** The seven lower-section categories: score a pattern. */
export type LowerCategory =
  | 'threeOfAKind'
  | 'fourOfAKind'
  | 'fullHouse'
  | 'smallStraight'
  | 'largeStraight'
  | 'fiveOfAKind'
  | 'chance'

export type Category = UpperCategory | LowerCategory

/** Points recorded so far. A category is absent until it has been scored. */
export type Scores = Partial<Record<Category, number>>

/** One player's scorecard. */
export interface ScoreSheet {
  scores: Scores
  /** How many +100 Five of a Kind bonuses have been earned. */
  fiveOfAKindBonuses: number
}

/** Options chosen on the new-game form. */
export interface Settings {
  /** Optional rule: +100 for each extra Five of a Kind. */
  fiveOfAKindBonus: boolean
}

/** Everything needed to start a game. */
export interface GameSetup {
  playerNames: string[]
  settings: Settings
}

export interface Player {
  name: string
  sheet: ScoreSheet
}
