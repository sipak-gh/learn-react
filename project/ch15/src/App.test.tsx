import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { RngContext } from './components/contexts'
import { CATEGORIES, CATEGORY_LABELS } from './game/rules'
import type { Rng } from './game/dice'
import type { DieValue } from './game/types'

/** An rng that makes the dice show `faces` in order, over and over. */
function fakeDice(...faces: DieValue[]): Rng {
  let i = 0
  return () => (faces[i++ % faces.length] - 1) / 6
}

/** The values the five dice currently show, read the way a screen reader would. */
function diceValues() {
  return screen.getAllByRole('button', { name: /^Die showing/ }).map((die) => die.getAttribute('aria-label'))
}

/** Render the app, with fake dice if `rng` is given. */
function renderApp(rng: Rng = Math.random) {
  // A provider in the test replaces the context's default (Math.random).
  render(
    <RngContext value={rng}>
      <App />
    </RngContext>,
  )
  return userEvent.setup()
}

/** Render the app and start a game from the new-game form. */
async function startGame(rng?: Rng, players = 1) {
  const user = renderApp(rng)
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

describe('App', () => {
  it('starts with the new-game form', () => {
    render(<App />)
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

    for (const category of CATEGORIES) {
      await user.click(screen.getByRole('button', { name: 'Roll' }))
      await user.click(scoreButton(CATEGORY_LABELS[category]))
    }

    // Sixes 30 + Three/Four of a Kind 30 + 30 + Five of a Kind 50 + Chance 30 = 170,
    // plus 100: Chance came after Five of a Kind, so its five sixes earn the bonus.
    expect(screen.getByRole('heading', { name: 'Game over' })).toBeInTheDocument()
    // Focus moved to the result, so screen readers announce it.
    expect(screen.getByText('Final score: 270')).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
    // The result went into the high-score table (rank, name, score, date).
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
    for (const category of CATEGORIES) {
      for (let player = 0; player < 2; player++) {
        await user.click(screen.getByRole('button', { name: 'Roll' }))
        await user.click(scoreButton(CATEGORY_LABELS[category]))
      }
    }
    expect(screen.getByText("It's a tie: Player 1 and Player 2 with 270!")).toBeInTheDocument()
  })

  it('goes back to the form for a new game', async () => {
    const user = await startGame(fakeDice(6), 2)
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(screen.getByRole('button', { name: 'New game' }))
    expect(screen.getByRole('heading', { name: 'New game' })).toBeInTheDocument()
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
    renderApp()
    expect(screen.getByRole('row', { name: 'Sixes 30' })).toBeInTheDocument()

    // "New game" forgets the saved game.
    await user.click(screen.getByRole('button', { name: 'New game' }))
    cleanup()
    renderApp()
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
    renderApp()
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
