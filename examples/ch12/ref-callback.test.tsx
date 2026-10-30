import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import PlayerList from './ref-callback.demo'

/** Returns what was logged since the last call, one string per console.log call. */
function spyOnLog() {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  return () => {
    const lines = log.mock.calls.map((args) => args.join(' '))
    log.mockClear()
    return lines
  }
}

it('calls the ref callback on attach and its cleanup on detach', async () => {
  const logged = spyOnLog()
  const user = userEvent.setup()
  render(<PlayerList />)
  expect(logged()).toEqual(['attach Ada', 'attach Bo', 'attach Cy'])

  // An inline callback is a new function on every render, so React
  // detaches the old one and attaches the new one, for every item.
  await user.click(screen.getByRole('button', { name: 'Add player' }))
  expect(logged()).toEqual([
    'detach Ada',
    'detach Bo',
    'detach Cy',
    'attach Ada',
    'attach Bo',
    'attach Cy',
    'attach Di',
  ])
})

it('runs every ref callback twice on mount in Strict Mode', () => {
  const logged = spyOnLog()
  render(<PlayerList />, { reactStrictMode: true })
  expect(logged()).toEqual([
    'attach Ada',
    'attach Bo',
    'attach Cy',
    'detach Ada',
    'detach Bo',
    'detach Cy',
    'attach Ada',
    'attach Bo',
    'attach Cy',
  ])
})
