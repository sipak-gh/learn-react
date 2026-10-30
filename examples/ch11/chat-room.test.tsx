import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import ChatRoomDemo from './chat-room.demo'

/** Everything the demo logged, one string per console.log call. */
function spyOnLog() {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  return () => log.mock.calls.map((args) => args.join(' '))
}

it('connects, reconnects when the room changes, and disconnects on unmount', async () => {
  const logged = spyOnLog()
  const user = userEvent.setup()
  render(<ChatRoomDemo />)
  await user.selectOptions(screen.getByRole('combobox', { name: 'Room' }), 'travel')
  await user.click(screen.getByRole('button', { name: 'Close chat' }))

  expect(logged()).toEqual([
    'connect to "general"',
    'disconnect from "general"',
    'connect to "travel"',
    'disconnect from "travel"',
  ])
})

it('runs setup, cleanup, setup on mount in Strict Mode', () => {
  const logged = spyOnLog()
  // The same as wrapping the tree in <StrictMode>, like main.tsx does.
  render(<ChatRoomDemo />, { reactStrictMode: true })

  expect(logged()).toEqual(['connect to "general"', 'disconnect from "general"', 'connect to "general"'])
})
