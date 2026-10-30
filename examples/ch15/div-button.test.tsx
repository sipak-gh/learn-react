import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import DivButtonDemo from './div-button.demo'

it('only the real button works from the keyboard', async () => {
  const user = userEvent.setup()
  render(<DivButtonDemo />)

  // The div is not a button to assistive technology, so it has no role.
  expect(screen.queryByRole('button', { name: 'Roll (div)' })).not.toBeInTheDocument()

  // Tab skips the div and lands on the button; Enter and Space press it.
  await user.tab()
  expect(screen.getByRole('button', { name: 'Roll (button)' })).toHaveFocus()
  await user.keyboard('{Enter}')
  await user.keyboard(' ')
  expect(screen.getByText('Button clicks: 2')).toBeInTheDocument()

  // A mouse click still works on the div.
  await user.click(screen.getByText('Roll (div)'))
  expect(screen.getByText('Div clicks: 1')).toBeInTheDocument()
})
