import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { memo, useCallback, useMemo, useState } from 'react'
import { beforeEach, expect, it } from 'vitest'

let renders: string[] = []
beforeEach(() => {
  renders = []
})

interface DieProps {
  index: number
  held: boolean
  onToggle: (index: number) => void
}

// memo() returns a component that skips rendering when every prop is
// Object.is-equal to the one it got last time.
const Die = memo(function Die({ index, held, onToggle }: DieProps) {
  renders.push(`Die ${index + 1}`)
  return (
    <button type="button" aria-pressed={held} onClick={() => onToggle(index)}>
      Die {index + 1}
    </button>
  )
})

const flip = (held: boolean[], index: number) => held.map((h, i) => (i === index ? !h : h))

function Tray({ stable }: { stable: boolean }) {
  const [held, setHeld] = useState([false, false])
  const [rolls, setRolls] = useState(0)

  // A new function on every render...
  const inline = (index: number) => setHeld((current) => flip(current, index))
  // ...or the same function every time (setHeld never changes).
  const cached = useCallback((index: number) => setHeld((current) => flip(current, index)), [])
  const onToggle = stable ? cached : inline

  return (
    <>
      <button type="button" onClick={() => setRolls(rolls + 1)}>
        Rolls: {rolls}
      </button>
      {held.map((h, i) => (
        <Die key={i} index={i} held={h} onToggle={onToggle} />
      ))}
    </>
  )
}

it('does nothing when a prop is a new function every render', async () => {
  const user = userEvent.setup()
  render(<Tray stable={false} />)

  renders = []
  await user.click(screen.getByRole('button', { name: 'Rolls: 0' }))
  expect(renders).toEqual(['Die 1', 'Die 2'])
})

it('skips the render when every prop is the same value', async () => {
  const user = userEvent.setup()
  render(<Tray stable={true} />)

  renders = []
  await user.click(screen.getByRole('button', { name: 'Rolls: 0' }))
  expect(renders).toEqual([])

  await user.click(screen.getByRole('button', { name: 'Die 1' }))
  expect(renders).toEqual(['Die 1']) // only the die whose `held` changed
})

const Total = memo(function Total({ dice }: { dice: number[] }) {
  renders.push('Total')
  return <output>{dice.reduce((sum, die) => sum + die, 0)}</output>
})

function Board({ cacheArray }: { cacheArray: boolean }) {
  const [tick, setTick] = useState(0)
  const fresh = [3, 4, 5]
  const cached = useMemo(() => [3, 4, 5], [])
  return (
    <>
      <button type="button" onClick={() => setTick(tick + 1)}>
        Tick {tick}
      </button>
      <Total dice={cacheArray ? cached : fresh} />
    </>
  )
}

it('treats a new array with the same contents as a changed prop', async () => {
  const user = userEvent.setup()
  const { unmount } = render(<Board cacheArray={false} />)
  renders = []
  await user.click(screen.getByRole('button', { name: 'Tick 0' }))
  expect(renders).toEqual(['Total'])
  unmount()

  render(<Board cacheArray={true} />)
  renders = []
  await user.click(screen.getByRole('button', { name: 'Tick 0' }))
  expect(renders).toEqual([])
})
