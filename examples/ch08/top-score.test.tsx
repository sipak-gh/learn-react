import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { fetchTopScore } from './top-score'
import TopScoreButton from './top-score.demo'

// Replaces the whole module for this test file. Vitest moves this call above the imports.
vi.mock('./top-score', () => ({ fetchTopScore: vi.fn() }))

it('shows the score the API returns', async () => {
  vi.mocked(fetchTopScore).mockResolvedValue({ name: 'Ada', score: 287 })
  const user = userEvent.setup()
  render(<TopScoreButton />)

  await user.click(screen.getByRole('button', { name: 'Load top score' }))

  expect(await screen.findByText('Top score: Ada, 287')).toBeInTheDocument()
  expect(fetchTopScore).toHaveBeenCalledOnce()
})

it('shows an error when the API fails', async () => {
  vi.mocked(fetchTopScore).mockRejectedValue(new Error('HTTP 500'))
  const user = userEvent.setup()
  render(<TopScoreButton />)

  await user.click(screen.getByRole('button', { name: 'Load top score' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load: HTTP 500')
})
