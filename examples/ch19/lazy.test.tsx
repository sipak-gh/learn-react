import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import LazyDemo from './lazy.demo.tsx'

it('shows the statistics once their code has loaded', async () => {
  const user = userEvent.setup()
  render(<LazyDemo />)

  await user.click(screen.getByRole('button', { name: 'Show statistics' }))

  // findBy… retries until the element appears (or 1 second passes).
  const table = await screen.findByRole('table', { name: 'Chance in a single roll' })
  expect(table).toHaveTextContent('Five of a Kind0.08 %')
})
