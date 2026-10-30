import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Stopwatch from './stopwatch.demo'

// Fake timers also fake Date.now(), so the times are exact.
beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

it('runs until stopped', () => {
  render(<Stopwatch />)
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  act(() => vi.advanceTimersByTime(1500))
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
  act(() => vi.advanceTimersByTime(1500))
  expect(screen.getByText('Time: 1.50 s')).toBeInTheDocument()
})
