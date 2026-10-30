import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { PlayerNames } from './flush-sync.demo'

it('focuses the old last input without flushSync', async () => {
  const user = userEvent.setup()
  render(<PlayerNames sync={false} />)
  await user.click(screen.getByRole('button', { name: 'Add player (plain)' }))
  expect(screen.getByRole('textbox', { name: 'Player 1' })).toHaveFocus()
})

it('focuses the new input with flushSync', async () => {
  const user = userEvent.setup()
  render(<PlayerNames sync />)
  await user.click(screen.getByRole('button', { name: 'Add player (flushSync)' }))
  expect(screen.getByRole('textbox', { name: 'Player 2' })).toHaveFocus()
})
