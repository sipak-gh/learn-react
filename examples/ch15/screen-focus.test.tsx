import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import ScreenFocusDemo from './screen-focus.demo'

it('loses focus when the pressed button disappears', async () => {
  const user = userEvent.setup()
  render(<ScreenFocusDemo moveFocus={false} />)

  await user.click(screen.getByRole('button', { name: 'Start game' }))
  // The focused button left the page, so the browser fell back to <body>.
  expect(document.body).toHaveFocus()
})

it("moves focus to the new screen's heading", async () => {
  const user = userEvent.setup()
  render(<ScreenFocusDemo />)

  await user.click(screen.getByRole('button', { name: 'Start game' }))
  expect(screen.getByRole('heading', { name: 'Game' })).toHaveFocus()

  // The next Tab goes to the first control after the heading.
  await user.tab()
  expect(screen.getByRole('button', { name: 'Quit' })).toHaveFocus()

  await user.keyboard('{Enter}')
  expect(screen.getByRole('heading', { name: 'Menu' })).toHaveFocus()
})
