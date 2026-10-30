import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import App from './App'
import { LeaderboardContext } from './components/contexts'
import { createFakeLeaderboard } from './services/leaderboard'

// In this file the rules' code fails to download, as when the player is
// offline or the tab is older than the last deploy.
vi.mock('./components/RulesDialog', () => {
  throw new TypeError('Failed to fetch dynamically imported module')
})

it('offers a reload when the rules fail to load', async () => {
  // React reports errors caught by error boundaries with console.error.
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  await act(async () => {
    render(
      <LeaderboardContext value={createFakeLeaderboard({ latency: 0 })}>
        <App />
      </LeaderboardContext>,
    )
  })
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: 'Rules' }))
  const dialog = await screen.findByRole('dialog', { name: "Couldn't load the rules" })
  expect(within(dialog).getByRole('button', { name: 'Reload' })).toBeInTheDocument()
  expect(consoleError).toHaveBeenCalled()

  // Cancel closes it, and the rest of the app still works.
  await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'New game' })).toBeInTheDocument()
  consoleError.mockRestore()
})
