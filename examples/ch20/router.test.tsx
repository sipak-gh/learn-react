import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { expect, it } from 'vitest'
import { DiceRoutes } from './router.demo.tsx'

// MemoryRouter keeps the URL in memory, so a test can start anywhere.
function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <DiceRoutes />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

it('shows the page for the URL and follows links', async () => {
  const user = renderAt('/players/ada')
  expect(screen.getByRole('heading', { name: 'Ada' })).toBeInTheDocument()
  // NavLink marks the link to the current section for screen readers.
  expect(screen.getByRole('link', { name: 'Players' })).toHaveAttribute('aria-current', 'page')

  await user.click(screen.getByRole('link', { name: 'All players' }))
  await user.click(screen.getByRole('link', { name: 'Bo' }))
  expect(screen.getByRole('heading', { name: 'Bo' })).toBeInTheDocument()
  expect(screen.getByText('Best score: 245')).toBeInTheDocument()
})

it('handles unknown players and pages', () => {
  renderAt('/players/zed')
  expect(screen.getByRole('heading', { name: 'No player called “zed”' })).toBeInTheDocument()
})

it('matches * when no other route does', () => {
  renderAt('/nowhere')
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
})
