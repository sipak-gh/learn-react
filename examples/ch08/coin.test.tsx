import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import Coin from './coin.demo'

/** A fake rng that returns the given numbers in order. */
function fakeRng(...values: number[]) {
  return () => {
    const next = values.shift()
    if (next === undefined) throw new Error('fakeRng ran out of values')
    return next
  }
}

describe('Coin', () => {
  it('starts without a result and without a Reset button', () => {
    render(<Coin />)

    expect(screen.getByRole('heading', { name: 'Coin flip' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Not flipped yet')
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument()
  })

  it('shows the side that the rng picks', async () => {
    const user = userEvent.setup()
    render(<Coin rng={fakeRng(0.1, 0.9)} />)

    await user.click(screen.getByRole('button', { name: 'Flip' }))
    expect(screen.getByRole('status')).toHaveTextContent('Heads')

    await user.click(screen.getByRole('button', { name: 'Flip' }))
    expect(screen.getByRole('status')).toHaveTextContent('Tails')
    expect(screen.getByText('Flips: 2')).toBeInTheDocument()
  })

  it('starts again after Reset', async () => {
    const user = userEvent.setup()
    render(<Coin rng={fakeRng(0.7)} />)

    await user.click(screen.getByRole('button', { name: 'Flip' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(screen.getByRole('status')).toHaveTextContent('Not flipped yet')
    expect(screen.getByText('Flips: 0')).toBeInTheDocument()
  })

  it('renders this markup after one flip', async () => {
    const user = userEvent.setup()
    const { container } = render(<Coin rng={fakeRng(0.2)} />)

    await user.click(screen.getByRole('button', { name: 'Flip' }))
    expect(container.innerHTML).toMatchInlineSnapshot(`"<main><h1>Coin flip</h1><p role="status">Heads</p><p>Flips: 1</p><button type="button">Flip</button><button type="button">Reset</button></main>"`)
  })
})
