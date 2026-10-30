import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { LeaderboardContext, RngContext } from './components/contexts'
import { CATEGORIES, CATEGORY_LABELS } from './game/rules'
import type { Rng } from './game/dice'
import type { DieValue } from './game/types'
import { createFakeLeaderboard } from './services/leaderboard'

/** An rng that makes the dice show `faces` in order, over and over. */
function fakeDice(...faces: DieValue[]): Rng {
  let i = 0
  return () => (faces[i++ % faces.length] - 1) / 6
}

/** The values the five dice currently show, read the way a screen reader would. */
function diceValues() {
  return screen.getAllByRole('button', { name: /^Die showing/ }).map((die) => die.getAttribute('aria-label'))
}

/** Render the app, with fake dice if `rng` is given, and an instant leaderboard. */
async function renderApp(rng: Rng = Math.random) {
  // The leaderboard suspends while it loads; an awaited act() lets React
  // finish that before the test goes on.
  await act(async () => {
    // A provider in the test replaces the context's default (Math.random).
    render(
      <LeaderboardContext value={createFakeLeaderboard({ latency: 0 })}>
        <RngContext value={rng}>
          <App />
        </RngContext>
      </LeaderboardContext>,
    )
  })
  return userEvent.setup()
}

/** Render the app and start a game from the new-game form. */
async function startGame(rng?: Rng, players = 1) {
  const user = await renderApp(rng)
  for (let i = 1; i < players; i++) {
    await user.click(screen.getByRole('button', { name: 'Add player' }))
  }
  await user.click(screen.getByRole('button', { name: 'Start game' }))
  return user
}

function scoreButton(label: string) {
  const row = screen.getByRole('row', { name: new RegExp(`^${label}`) })
  return within(row).getByRole('button')
}

/**
 * Click something that brings up the leaderboard. It suspends while it loads,
 * so click inside an awaited act(): React finishes loading it before we go on.
 */
async function clickAndLoad(element: HTMLElement) {
  await act(async () => fireEvent.click(element))
}

/** Roll and score each category in turn, for every player, until the game is over. */
async function playToTheEnd(user: ReturnType<typeof userEvent.setup>, players = 1) {
  for (const [turn, category] of CATEGORIES.entries()) {
    for (let player = 0; player < players; player++) {
      await user.click(screen.getByRole('button', { name: 'Roll' }))
      const button = scoreButton(CATEGORY_LABELS[category])
      if (turn === CATEGORIES.length - 1 && player === players - 1) {
        await clickAndLoad(button) // the game is over: on to the leaderboard
      } else {
        await user.click(button)
      }
    }
  }
}

describe('App', () => {
  it('starts with the new-game form', async () => {
    await renderApp()
    expect(screen.getByRole('heading', { name: 'New game' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Player 1' })).toHaveValue('Player 1')
  })

  it('starts a turn with the Roll button and no scores to pick', async () => {
    await startGame()
    expect(screen.getByRole('heading', { name: "Player 1's turn" })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Roll' })).toBeEnabled()
    expect(screen.getByText(/Rolls left: 3/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Die showing/ })[0]).toBeDisabled()
    expect(screen.getByRole('row', { name: /^Chance/ })).not.toContainElement(screen.queryByRole('button', { name: /^\d+$/ }))
  })

  it('rolls the dice and shows what each category would score', async () => {
    const user = await startGame(fakeDice(6))

    await user.click(screen.getByRole('button', { name: 'Roll' }))

    expect(diceValues()).toEqual(Array(5).fill('Die showing 6'))
    expect(screen.getByText(/Rolls left: 2/)).toBeInTheDocument()
    expect(scoreButton('Five of a Kind')).toHaveTextContent('50')
    expect(scoreButton('Sixes')).toHaveTextContent('30')
    expect(scoreButton('Full House')).toHaveTextContent('0')
  })

  it('keeps held dice and stops after three rolls', async () => {
    const user = await startGame(fakeDice(1, 2, 3, 4, 5, 6))
    const roll = screen.getByRole('button', { name: 'Roll' })

    await user.click(roll) // 1 2 3 4 5
    const first = screen.getByRole('button', { name: 'Die showing 1' })
    await user.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')

    await user.click(roll) // the held die keeps its 1
    await user.click(roll)
    expect(diceValues()[0]).toBe('Die showing 1')
    expect(roll).toBeDisabled()
    expect(screen.getByText(/No rolls left/)).toBeInTheDocument()
  })

  it('records a score and starts the next turn', async () => {
    const user = await startGame(fakeDice(6))

    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(scoreButton('Five of a Kind'))

    expect(screen.getByRole('row', { name: 'Five of a Kind 50' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: 'Total 50' })).toBeInTheDocument()
    expect(screen.getByText(/Rolls left: 3/)).toBeInTheDocument()
  })

  it('plays 13 turns to the end and starts again', async () => {
    const user = await startGame(fakeDice(6))

    await playToTheEnd(user)

    // Sixes 30 + Three/Four of a Kind 30 + 30 + Five of a Kind 50 + Chance 30 = 170,
    // plus 100: Chance came after Five of a Kind, so its five sixes earn the bonus.
    // The result pops up in a dialog.
    const dialog = screen.getByRole('dialog', { name: 'Game over' })
    expect(within(dialog).getByText('Final score: 270')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(dialog).not.toBeInTheDocument()
    // Focus waits on the result on the board (the browser returns it there
    // when the dialog closes), so screen readers announce it.
    expect(screen.getByText('Final score: 270')).toHaveFocus()
    // Submit the result to the leaderboard (rank, name, score, date).
    await user.click(screen.getByRole('button', { name: 'Submit score' }))
    expect(await screen.findByText('Saved!')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /^1 Player 1 270 \d{4}-\d\d-\d\d$/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Play again' }))
    expect(screen.getByRole('row', { name: 'Total 0' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Player 1's turn" })).toHaveFocus()
  })

  it('takes turns between players and highlights whose turn it is', async () => {
    const user = await startGame(fakeDice(6), 2)
    const columnHeader = (name: string) => screen.getByRole('columnheader', { name })

    // Test what users perceive: aria-current, not a CSS class.
    expect(columnHeader('Player 1')).toHaveAttribute('aria-current', 'true')
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(scoreButton('Sixes'))

    expect(screen.getByRole('heading', { name: "Player 2's turn" })).toBeInTheDocument()
    expect(columnHeader('Player 2')).toHaveAttribute('aria-current', 'true')
    expect(columnHeader('Player 1')).toHaveAttribute('aria-current', 'false')
    expect(screen.getByRole('row', { name: 'Sixes 30' })).toBeInTheDocument()
    // The standings list the leader first.
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '1.Player 130',
      '2.Player 20',
    ])
  })

  it('announces a tie when players finish level', async () => {
    const user = await startGame(fakeDice(6), 2)
    await playToTheEnd(user, 2)
    const dialog = screen.getByRole('dialog', { name: 'Game over' })
    expect(within(dialog).getByText("It's a tie: Player 1 and Player 2 with 270!")).toBeInTheDocument()
  })

  it('asks before leaving a game for a new one', async () => {
    const user = await startGame(fakeDice(6), 2)
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await user.click(screen.getByRole('button', { name: 'New game' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Start a new game?' })).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(/Rolls left: 2/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'New game' }))
    await clickAndLoad(screen.getByRole('button', { name: 'Start new game' }))
    expect(screen.getByRole('heading', { name: 'New game' })).toBeInTheDocument()
    expect(screen.getByText(/No scores yet/)).toBeInTheDocument()
  })

  it('explains the rules in a dialog', async () => {
    const user = await startGame(fakeDice(1, 2, 3, 4, 5, 6))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(screen.getByRole('button', { name: 'Rules' }))

    const dialog = screen.getByRole('dialog', { name: 'How to play' })
    expect(within(dialog).getByRole('row', { name: /^Full House .* 25$/ })).toBeInTheDocument()

    // Keyboard shortcuts are off while you use the dialog.
    within(dialog).getByRole('button', { name: 'Close' }).focus()
    await user.keyboard('1')
    expect(screen.getByRole('button', { name: 'Die showing 1' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(dialog).not.toBeInTheDocument()
  })

  it('can be played with the keyboard', async () => {
    const user = await startGame(fakeDice(1, 2, 3, 4, 5, 6))

    await user.keyboard(' ') // Space rolls
    expect(screen.getByText(/Rolls left: 2/)).toBeInTheDocument()
    await user.keyboard('1') // 1–5 hold a die
    expect(screen.getByRole('button', { name: 'Die showing 1' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows whose turn it is in the tab title', async () => {
    const user = await startGame(fakeDice(6))
    expect(document.title).toBe('Player 1 · turn 1/13 · Five Dice')
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(scoreButton('Chance'))
    expect(document.title).toBe('Player 1 · turn 2/13 · Five Dice')
  })

  it('resumes a saved game after a reload', async () => {
    const user = await startGame(fakeDice(6))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(scoreButton('Sixes'))

    // Unmount and mount again: like closing the tab and coming back.
    cleanup()
    await renderApp()
    expect(screen.getByRole('row', { name: 'Sixes 30' })).toBeInTheDocument()

    // "New game" forgets the saved game.
    await user.click(screen.getByRole('button', { name: 'New game' }))
    await clickAndLoad(screen.getByRole('button', { name: 'Start new game' }))
    cleanup()
    await renderApp()
    expect(screen.getByRole('heading', { name: 'New game' })).toBeInTheDocument()
  })

  it('moves focus to the Roll button after scoring', async () => {
    const user = await startGame(fakeDice(6))
    const roll = screen.getByRole('button', { name: 'Roll' })
    await user.click(roll)
    await user.click(roll)
    await user.click(roll)
    expect(roll).toBeDisabled()

    await user.click(scoreButton('Sixes'))
    expect(roll).toHaveFocus()
  })

  it('animates only the dice that are not held', async () => {
    const user = await startGame(fakeDice(6))
    // setup.ts replaced Element.prototype.animate with a mock function.
    const animate = vi.mocked(Element.prototype.animate)

    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(animate).toHaveBeenCalledTimes(5)

    await user.click(screen.getAllByRole('button', { name: 'Die showing 6' })[0])
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(animate).toHaveBeenCalledTimes(5 + 4)
  })

  it('applies the chosen theme to <html> and remembers it', async () => {
    const user = userEvent.setup()
    await renderApp()
    const theme = screen.getByRole('combobox', { name: 'Theme' })
    expect(theme).toHaveValue('system')

    await user.selectOptions(theme, 'dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem('five-dice:theme')).toBe('"dark"')

    await user.selectOptions(theme, 'system')
    expect(document.documentElement).not.toHaveAttribute('data-theme')
  })

  describe('accessibility', () => {
    it('announces rolls and scores in a live region', async () => {
      const user = await startGame(fakeDice(6, 6, 6, 5, 5))
      const status = screen.getByRole('status')
      expect(status).toBeEmptyDOMElement()

      await user.click(screen.getByRole('button', { name: 'Roll' }))
      expect(status).toHaveTextContent('Player 1 rolled 6, 6, 6, 5, 5. 2 rolls left.')

      await user.click(screen.getByRole('button', { name: 'Score 25 in Full House' }))
      expect(status).toHaveTextContent('Player 1 scored 25 in Full House.')
    })

    it('gives the board landmarks and the scorecard table headers', async () => {
      const user = await startGame(fakeDice(6))
      for (const name of ["Player 1's turn", 'Standings', 'Scorecard']) {
        expect(screen.getByRole('region', { name })).toBeInTheDocument()
      }
      const table = screen.getByRole('table', { name: 'Scores by category, one column per player' })
      expect(within(table).getByRole('columnheader', { name: 'Player 1' })).toBeInTheDocument()
      expect(within(table).getByRole('rowheader', { name: 'Sixes' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Roll' }))
      expect(screen.getByRole('button', { name: 'Score 30 in Sixes' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Score 50 in Five of a Kind' })).toBeInTheDocument()
    })

    it("moves focus to the new screen's heading", async () => {
      const user = await startGame()
      expect(screen.getByRole('heading', { name: "Player 1's turn" })).toHaveFocus()

      await user.click(screen.getByRole('button', { name: 'New game' }))
      await clickAndLoad(screen.getByRole('button', { name: 'Start new game' }))
      expect(screen.getByRole('heading', { name: 'New game' })).toHaveFocus()
    })

    it('can play a turn with Tab, Enter and Space alone', async () => {
      const user = await startGame(fakeDice(6))
      const roll = screen.getByRole('button', { name: 'Roll' })
      // Tab through the page until we reach the Roll button.
      for (let i = 0; i < 10 && document.activeElement !== roll; i++) await user.tab()
      expect(roll).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(screen.getByText(/Rolls left: 2/)).toBeInTheDocument()

      // Shift+Tab goes back to the last die; Space on a button presses it.
      await user.tab({ shift: true })
      expect(document.activeElement).toHaveAccessibleName('Die showing 6')
      await user.keyboard(' ')
      expect(document.activeElement).toHaveAttribute('aria-pressed', 'true')

      // Forward past Roll to the first score button, and score with Enter.
      await user.tab()
      await user.tab()
      expect(document.activeElement).toHaveAccessibleName('Score 0 in Ones')
      await user.keyboard('{Enter}')
      expect(screen.getByRole('row', { name: 'Ones 0' })).toBeInTheDocument()
      expect(roll).toHaveFocus()
    })
  })
})
