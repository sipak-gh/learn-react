import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NewGameForm } from './NewGameForm'

describe('NewGameForm', () => {
  it('starts a game with the typed names and options', async () => {
    const user = userEvent.setup()
    // vi.fn() makes a mock function that remembers how it was called.
    const onStart = vi.fn()
    render(<NewGameForm onStart={onStart} />)

    const first = screen.getByRole('textbox', { name: 'Player 1' })
    await user.clear(first)
    await user.type(first, '  Ada ')
    await user.click(screen.getByRole('button', { name: 'Add player' }))
    await user.click(screen.getByRole('checkbox', { name: /bonus/ }))
    await user.click(screen.getByRole('button', { name: 'Start game' }))

    expect(onStart).toHaveBeenCalledExactlyOnceWith({
      playerNames: ['Ada', 'Player 2'],
      settings: { fiveOfAKindBonus: false },
    })
  })

  it('adds up to four players and removes them', async () => {
    const user = userEvent.setup()
    render(<NewGameForm onStart={() => {}} />)
    const add = screen.getByRole('button', { name: 'Add player' })

    await user.click(add)
    await user.click(add)
    await user.click(add)
    expect(screen.getAllByRole('textbox')).toHaveLength(4)
    expect(add).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Remove player 2' }))
    expect(screen.getAllByRole('textbox').map((input) => (input as HTMLInputElement).value)).toEqual([
      'Player 1',
      'Player 3',
      'Player 4',
    ])
  })

  it('shows an error and keeps the inputs when names are invalid', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    render(<NewGameForm onStart={onStart} />)

    await user.clear(screen.getByRole('textbox', { name: 'Player 1' }))
    await user.click(screen.getByRole('checkbox', { name: /bonus/ }))
    await user.click(screen.getByRole('button', { name: 'Start game' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Every player needs a name.')
    expect(screen.getByRole('checkbox', { name: /bonus/ })).not.toBeChecked()
    expect(onStart).not.toHaveBeenCalled()
  })
})
