import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it } from 'vitest'
import StatePositionDemo from './state-position.demo'

const counters = () =>
  screen
    .getAllByRole('button')
    .slice(1) // skip "Switch player"
    .map((button) => button.textContent)

it('keeps state by position and resets it by key', async () => {
  const user = userEvent.setup()
  render(<StatePositionDemo />)

  // Click every counter once: all show 1.
  for (const button of screen.getAllByRole('button').slice(1)) await user.click(button)
  expect(counters()).toEqual(['Ada: 1', 'Ada: 1', 'Ada: 1', 'Ada: 1'])

  await user.click(screen.getByRole('button', { name: 'Switch player' }))
  expect(counters()).toEqual(['Bo: 1', 'Bo: 1', 'Bo: 0', 'Bo: 0'])
})

// 🔴 A component defined inside another component.
function Parent() {
  const [count, setCount] = useState(0)
  // A brand-new Inner function, so a new component type, on every render of Parent.
  function Inner() {
    const [clicks, setClicks] = useState(0)
    return (
      <button type="button" onClick={() => setClicks(clicks + 1)}>
        Inner: {clicks}
      </button>
    )
  }
  return (
    <>
      <button type="button" onClick={() => setCount(count + 1)}>
        Parent: {count}
      </button>
      {/* oxlint-disable-next-line react/static-components -- the bug being shown */}
      <Inner />
    </>
  )
}

it('loses the state of a component defined inside another one', async () => {
  const user = userEvent.setup()
  render(<Parent />)
  await user.click(screen.getByRole('button', { name: 'Inner: 0' }))
  expect(screen.getByRole('button', { name: 'Inner: 1' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Parent: 0' }))
  expect(screen.getByRole('button', { name: 'Inner: 0' })).toBeInTheDocument()
})
