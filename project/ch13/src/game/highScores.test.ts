import { describe, expect, it } from 'vitest'
import { addHighScores, MAX_HIGH_SCORES, type HighScore } from './highScores'

const entry = (name: string, score: number): HighScore => ({ name, score, date: '2026-01-01' })

describe('addHighScores', () => {
  it('sorts best first and keeps older entries above equal new ones', () => {
    const table = [entry('Ada', 200), entry('Bo', 150)]
    expect(addHighScores(table, [entry('Cy', 150), entry('Di', 300)]).map((e) => e.name)).toEqual([
      'Di',
      'Ada',
      'Bo',
      'Cy',
    ])
  })

  it(`keeps only the top ${MAX_HIGH_SCORES}`, () => {
    const table = Array.from({ length: MAX_HIGH_SCORES }, (_, i) => entry(`P${i}`, 100 + i))
    const result = addHighScores(table, [entry('Low', 1), entry('High', 999)])
    expect(result).toHaveLength(MAX_HIGH_SCORES)
    expect(result[0].name).toBe('High')
    expect(result.some((e) => e.name === 'Low')).toBe(false)
  })
})
