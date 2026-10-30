import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import PlayerCardDemo from './player-card.demo'

beforeEach(() => {
  vi.useFakeTimers() // the fake server uses setTimeout: we decide when it answers
})
afterEach(() => {
  vi.useRealTimers()
})

// Let the "server" answer, inside act() so React finishes rendering first.
const answer = () => act(async () => vi.advanceTimersByTime(800))
// A click that suspends: await act() lets React finish the work it starts.
const click = (name: string) => act(async () => fireEvent.click(screen.getByRole('button', { name })))

it('shows the Suspense fallback until the promise resolves', async () => {
  await act(async () => render(<PlayerCardDemo />))
  expect(screen.getByText('Loading player…')).toBeInTheDocument()

  await answer()
  expect(screen.getByText('Ada: best score 150')).toBeInTheDocument()
})

it('replaces the content with the fallback on a normal update', async () => {
  await act(async () => render(<PlayerCardDemo />))
  await answer()

  await click('Next player')
  expect(screen.getByText('Loading player…')).toBeInTheDocument()
  // The old card is still in the DOM, but hidden with display: none.
  expect(screen.getByText('Ada: best score 150')).not.toBeVisible()

  await answer()
  expect(screen.getByText('Bo: best score 167')).toBeInTheDocument()
})

it('keeps the old content during a transition', async () => {
  await act(async () => render(<PlayerCardDemo />))
  await answer()

  await click('Next player (transition)')
  expect(screen.getByText('Ada: best score 150')).toBeInTheDocument()
  expect(screen.getByText(/Loading…/)).toBeInTheDocument() // isPending
  expect(screen.queryByText('Loading player…')).not.toBeInTheDocument()

  await answer()
  expect(screen.getByText('Bo: best score 167')).toBeInTheDocument()
  expect(screen.queryByText(/Loading/)).not.toBeInTheDocument()
})
