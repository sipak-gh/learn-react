import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Results } from './search-race.demo'
import { slowSearch } from './slow-search'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

/** Type "a", then "ad" 50 ms later. The answer for "a" is slower, so it arrives last. */
async function typeAThenAd(ignoreStale: boolean) {
  const { rerender } = render(<Results query="a" search={slowSearch} ignoreStale={ignoreStale} />)
  await act(() => vi.advanceTimersByTimeAsync(50))
  rerender(<Results query="ad" search={slowSearch} ignoreStale={ignoreStale} />)
  await act(() => vi.advanceTimersByTimeAsync(2000))
  return screen.getByRole('paragraph').textContent
}

it('shows the stale answer without the ignore flag', async () => {
  expect(await typeAThenAd(false)).toBe('Results for "a": Ada, Adele, Alan')
})

it('keeps the latest answer with the ignore flag', async () => {
  expect(await typeAThenAd(true)).toBe('Results for "ad": Ada, Adele')
})
