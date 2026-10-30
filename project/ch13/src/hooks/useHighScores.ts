import { addHighScores, type HighScore } from '../game/highScores'
import { totals } from '../game/scoring'
import type { Player } from '../game/types'
import { useLocalStorage } from './useLocalStorage'

const EMPTY: HighScore[] = []

/** The local high-score table, and a function to add a finished game's results. */
export function useHighScores() {
  // Custom hooks can call other hooks, including your own.
  const [highScores, setHighScores] = useLocalStorage('five-dice:high-scores:v1', EMPTY)

  function recordGame(players: readonly Player[]) {
    const date = new Date().toISOString().slice(0, 10)
    const entries = players.map((player) => ({ name: player.name, score: totals(player.sheet).grand, date }))
    setHighScores(addHighScores(highScores, entries))
  }

  return { highScores, recordGame }
}
