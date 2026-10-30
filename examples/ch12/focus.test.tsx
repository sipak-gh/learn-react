import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import FocusDemo from './focus.demo'

it('moves focus to the input', async () => {
  const user = userEvent.setup()
  render(<FocusDemo />)
  await user.click(screen.getByRole('button', { name: 'Edit name' }))
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()
})
