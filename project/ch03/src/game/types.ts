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
