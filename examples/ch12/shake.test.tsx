import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import ShakeDemo from './shake.demo'

// jsdom has neither animations nor media queries: stub the two the demo uses.
Element.prototype.animate = vi.fn()
window.matchMedia = vi.fn().mockReturnValue({ matches: false })

it('shakes and focuses an empty name', async () => {
  const user = userEvent.setup()
  render(<ShakeDemo />)
  await user.click(screen.getByRole('button', { name: 'Join' }))

  const input = screen.getByRole('textbox', { name: 'Name' })
  expect(input).toHaveFocus()
  expect(Element.prototype.animate).toHaveBeenCalledOnce()
  expect(vi.mocked(Element.prototype.animate).mock.contexts[0]).toBe(input)
})

it('greets a real name without shaking', async () => {
  const user = userEvent.setup()
  render(<ShakeDemo />)
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada{Enter}')

  expect(screen.getByText('Hello, Ada!')).toBeInTheDocument()
  expect(Element.prototype.animate).not.toHaveBeenCalled()
})
