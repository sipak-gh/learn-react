export interface HighScore {
  name: string
  score: number
  /** When the game ended, as YYYY-MM-DD. */
  date: string
}

export const MAX_HIGH_SCORES = 10

/** Add new results to the table: best first, at most MAX_HIGH_SCORES entries. */
export function addHighScores(table: readonly HighScore[], entries: readonly HighScore[]): HighScore[] {
  // toSorted is stable: an older entry stays above a newer one with the same score.
  return [...table, ...entries].toSorted((a, b) => b.score - a.score).slice(0, MAX_HIGH_SCORES)
}
