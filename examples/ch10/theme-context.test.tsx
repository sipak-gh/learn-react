import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import ThemeContextDemo from './theme-context.demo'

const texts = () => screen.getAllByRole('paragraph').map((p) => p.textContent)

it('reads the nearest provider, or the default without one', async () => {
  const user = userEvent.setup()
  render(<ThemeContextDemo />)
  expect(texts()).toEqual([
    'Badge outside any provider: light',
    'Badge in the toolbar: dark',
    'Badge under a nested provider: light',
  ])

  await user.click(screen.getByRole('button', { name: 'Toggle theme' }))
  expect(texts()[1]).toBe('Badge in the toolbar: light')
})
