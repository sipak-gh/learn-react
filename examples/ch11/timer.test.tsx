import { act, fireEvent, render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TimerDemo from './timer.demo'

// Fake timers: setInterval only fires when the test moves the clock.
beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

/** Let `ms` milliseconds pass. act() applies the resulting state updates. */
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))

it('ticks while running and stops when paused', () => {
  render(<TimerDemo />)

  // fireEvent dispatches the click at once, without user-event's timers.
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  wait(3000)
  expect(screen.getByText('3 s')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
  wait(3000)
  expect(screen.getByText('3 s')).toBeInTheDocument()
})

// 🔴 The bug that a missing dependency causes.
function StaleTimer() {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    // This closure belongs to the first render, where seconds is 0.
    const id = setInterval(() => setSeconds(seconds + 1), 1000)
    return () => clearInterval(id)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- the bug we are demonstrating
  }, [])
  return <p>{seconds} s</p>
}

it('gets stuck at 1 when the Effect reads a stale value', () => {
  render(<StaleTimer />)
  wait(3000)
  expect(screen.getByText('1 s')).toBeInTheDocument()
})
