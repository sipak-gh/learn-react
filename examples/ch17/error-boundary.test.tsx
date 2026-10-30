import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ErrorBoundaryDemo, { ErrorBoundary } from './error-boundary.demo'

beforeEach(() => {
  vi.useFakeTimers()
  // React logs every caught error with console.error; keep the test output clean.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const answer = () => act(async () => vi.advanceTimersByTime(800))
const click = (name: string) => act(async () => fireEvent.click(screen.getByRole('button', { name })))

it('catches an error thrown while rendering', () => {
  function Broken(): never {
    throw new Error('Boom')
  }
  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong: Boom')
  expect(console.log).toHaveBeenCalledWith('Reported: Boom', expect.stringContaining('at Broken'))
})

it('catches a rejected promise read with use(), and resets with a new key', async () => {
  await act(async () => render(<ErrorBoundaryDemo />))
  await answer()
  expect(screen.getByText('Ada: best score 150')).toBeInTheDocument()

  await click('Load player -1')
  await answer()
  expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong: No player with id -1.')

  await click('Load player 1')
  await answer()
  expect(screen.getByText('Bo: best score 167')).toBeInTheDocument()
})
