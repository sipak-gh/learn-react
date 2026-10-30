import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { HighScore } from '../game/highScores'
import { createFakeLeaderboard, type LeaderboardService } from '../services/leaderboard'
import { LeaderboardContext } from './contexts'
import { Leaderboard } from './Leaderboard'

const bo: HighScore = { name: 'Bo', score: 250, date: '2026-01-02' }

/** A promise plus the functions that settle it, so a test decides when a request finishes. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

async function renderLeaderboard(service: LeaderboardService, results?: { name: string; score: number }[]) {
  // The component suspends while it loads. An awaited act() lets React
  // finish that work before the test goes on.
  await act(async () => {
    render(
      <LeaderboardContext value={service}>
        <Leaderboard results={results} />
      </LeaderboardContext>,
    )
  })
  return userEvent.setup()
}

describe('Leaderboard', () => {
  it('shows a loading message, then the scores', async () => {
    const load = deferred<HighScore[]>()
    await renderLeaderboard({ getTopScores: () => load.promise, submitScores: vi.fn() })
    expect(screen.getByText('Loading leaderboard…')).toBeInTheDocument()

    // The "server" answers. act() lets React show the result before we look.
    await act(async () => load.resolve([bo]))
    expect(screen.getByRole('row', { name: '1 Bo 250 2026-01-02' })).toBeInTheDocument()
  })

  it('reads the scores from the fake service', async () => {
    const service = createFakeLeaderboard({ latency: 0 })
    await service.submitScores([bo])
    await renderLeaderboard(service)
    expect(screen.getByRole('row', { name: '1 Bo 250 2026-01-02' })).toBeInTheDocument()
  })

  it('shows an error with a way to try again', async () => {
    // React reports errors caught by error boundaries with console.error.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const service: LeaderboardService = {
      getTopScores: vi.fn().mockRejectedValueOnce(new Error('Offline.')).mockResolvedValue([bo]),
      submitScores: vi.fn(),
    }
    await renderLeaderboard(service)

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load the leaderboard. Offline.")
    expect(consoleError).toHaveBeenCalledWith(
      expect.any(String),
      new Error('Offline.'),
      'The above error occurred in the <LeaderboardTable> component.',
      expect.stringContaining('using the error boundary you provided, ErrorBoundary'),
    )

    // Trying again loads (suspends) again, so await act() around the click too.
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Try again' })))
    expect(screen.getByRole('row', { name: '1 Bo 250 2026-01-02' })).toBeInTheDocument()
    consoleError.mockRestore()
  })

  it('shows submitted scores right away, while they are saved', async () => {
    const save = deferred<HighScore[]>()
    const service: LeaderboardService = { getTopScores: async () => [], submitScores: () => save.promise }
    const user = await renderLeaderboard(service, [{ name: 'Ada', score: 200 }])
    await screen.findByText(/No scores yet/)

    await user.click(screen.getByRole('button', { name: 'Submit score' }))

    // Optimistic: on screen before the "server" has answered.
    expect(screen.getByRole('row', { name: '1 Ada 200 Saving…' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit score' })).toBeDisabled()

    save.resolve([{ name: 'Ada', score: 200, date: '2026-01-02' }])
    expect(await screen.findByText('Saved!')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: '1 Ada 200 2026-01-02' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit score' })).toBeDisabled()
  })

  it('takes the optimistic row back when saving fails', async () => {
    const save = deferred<HighScore[]>()
    const service: LeaderboardService = { getTopScores: async () => [], submitScores: () => save.promise }
    const user = await renderLeaderboard(service, [{ name: 'Ada', score: 200 }])
    await screen.findByText(/No scores yet/)

    await user.click(screen.getByRole('button', { name: 'Submit score' }))
    expect(screen.getByText('Saving…')).toBeInTheDocument()

    save.reject(new Error('Offline.'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Not saved: Offline. Try again.')
    expect(screen.queryByText('Saving…')).not.toBeInTheDocument()
    expect(screen.getByText(/No scores yet/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit score' })).toBeEnabled()
  })
})
