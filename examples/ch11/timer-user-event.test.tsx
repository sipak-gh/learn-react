import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TimerDemo from './timer.demo'

beforeEach(() => {
  // The fake clock also follows real time, so user-event's short waits finish.
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => {
  vi.useRealTimers()
})

const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))

it('ticks while running and stops when paused, clicked with user-event', async () => {
  // user-event moves the fake clock by its own delays instead of waiting for them.
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(<TimerDemo />)

  await user.click(screen.getByRole('button', { name: 'Start' }))
  wait(3000)
  expect(screen.getByText('3 s')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Pause' }))
  wait(3000)
  expect(screen.getByText('3 s')).toBeInTheDocument()
})
