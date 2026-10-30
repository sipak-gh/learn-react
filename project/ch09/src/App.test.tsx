import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
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

/** Render the app and start a one-player game from the new-game form. */
async function startSoloGame(rng?: Rng) {
  const user = userEvent.setup()
  render(<App rng={rng} />)
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
    await startSoloGame()
    expect(screen.getByRole('heading', { name: "Player 1's turn" })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Roll' })).toBeEnabled()
    expect(screen.getByText(/Rolls left: 3/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Die showing/ })[0]).toBeDisabled()
    expect(screen.getByRole('row', { name: /^Chance/ })).not.toContainElement(screen.queryByRole('button', { name: /^\d+$/ }))
  })

  it('rolls the dice and shows what each category would score', async () => {
    const user = await startSoloGame(fakeDice(6))

    await user.click(screen.getByRole('button', { name: 'Roll' }))

    expect(diceValues()).toEqual(Array(5).fill('Die showing 6'))
    expect(screen.getByText(/Rolls left: 2/)).toBeInTheDocument()
    expect(scoreButton('Five of a Kind')).toHaveTextContent('50')
    expect(scoreButton('Sixes')).toHaveTextContent('30')
    expect(scoreButton('Full House')).toHaveTextContent('0')
  })

  it('keeps held dice and stops after three rolls', async () => {
    const user = await startSoloGame(fakeDice(1, 2, 3, 4, 5, 6))
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
    const user = await startSoloGame(fakeDice(6))

    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(scoreButton('Five of a Kind'))

    expect(screen.getByRole('row', { name: 'Five of a Kind 50' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: 'Total 50' })).toBeInTheDocument()
    expect(screen.getByText(/Rolls left: 3/)).toBeInTheDocument()
  })

  it('plays 13 turns to the end and starts again', async () => {
    const user = await startSoloGame(fakeDice(6))

    for (const category of CATEGORIES) {
      await user.click(screen.getByRole('button', { name: 'Roll' }))
      await user.click(scoreButton(CATEGORY_LABELS[category]))
    }

    // Sixes 30 + Three/Four of a Kind 30 + 30 + Five of a Kind 50 + Chance 30 = 170,
    // plus 100: Chance came after Five of a Kind, so its five sixes earn the bonus.
    expect(screen.getByRole('heading', { name: 'Game over' })).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Player 1: 270')
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Play again' }))
    expect(screen.getByRole('row', { name: 'Total 0' })).toBeInTheDocument()
  })

  it('takes turns between players', async () => {
    const user = userEvent.setup()
    render(<App rng={fakeDice(6)} />)
    await user.click(screen.getByRole('button', { name: 'Add player' }))
    await user.click(screen.getByRole('button', { name: 'Start game' }))

    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(scoreButton('Sixes'))
    expect(screen.getByRole('heading', { name: "Player 2's turn" })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'New game' }))
    expect(screen.getByRole('heading', { name: 'New game' })).toBeInTheDocument()
  })
})
