import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import WidgetDemo from './widget.demo'

const titles = (container: HTMLElement) =>
  [...container.querySelectorAll('.bars > div')].map((bar) => bar.getAttribute('title'))

it('creates, updates and destroys the widget with the component', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5) // every die shows 4
  const user = userEvent.setup()
  const { container } = render(<WidgetDemo />)
  expect(titles(container)).toEqual(['4', '4', '4', '4', '4'])

  vi.spyOn(Math, 'random').mockReturnValue(0) // every die shows 1
  await user.click(screen.getByRole('button', { name: 'Roll' }))
  expect(titles(container)).toEqual(['1', '1', '1', '1', '1'])

  await user.click(screen.getByRole('button', { name: 'Hide chart' }))
  expect(container.querySelector('.bars')).toBeNull()
})

it('ends up with one widget in Strict Mode', () => {
  const { container } = render(<WidgetDemo />, { reactStrictMode: true })
  // Created, destroyed by the cleanup, created again: still one.
  expect(container.querySelectorAll('.bars')).toHaveLength(1)
  expect(titles(container)).toHaveLength(5)
})
