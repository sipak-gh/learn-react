import { describe, expect, it } from 'vitest'
import { createFakeLeaderboard } from './leaderboard'

const ada = { name: 'Ada', score: 200, date: '2026-01-02' }
const bo = { name: 'Bo', score: 250, date: '2026-01-02' }

describe('fake leaderboard service', () => {
  it('stores submitted scores, best first', async () => {
    const service = createFakeLeaderboard({ latency: 0 })
    expect(await service.getTopScores()).toEqual([])
    expect(await service.submitScores([ada, bo])).toEqual([bo, ada])
    expect(await service.getTopScores()).toEqual([bo, ada])
  })

  it('shares a read that is already in flight', async () => {
    const service = createFakeLeaderboard({ latency: 0 })
    const first = service.getTopScores()
    expect(service.getTopScores()).toBe(first)
    await first
    expect(service.getTopScores()).not.toBe(first)
  })

  it('fails when told to', async () => {
    const service = createFakeLeaderboard({ latency: 0, failureRate: 1 })
    await expect(service.getTopScores()).rejects.toThrow('did not respond')
  })

  it('can be cancelled with an AbortController', async () => {
    const service = createFakeLeaderboard({ latency: 1000 })
    const controller = new AbortController()
    const request = service.submitScores([ada], { signal: controller.signal })
    controller.abort()
    await expect(request).rejects.toHaveProperty('name', 'AbortError')
    // The aborted request never reached the "server".
    expect(localStorage.getItem('five-dice:leaderboard:v1')).toBeNull()
  })
})
