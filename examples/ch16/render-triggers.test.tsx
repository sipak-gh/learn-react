import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { beforeEach, expect, it } from 'vitest'

// Each component writes its name here when React calls it. Writing to an
// outside variable during render is impure: fine for a test, never in an app.
let renders: string[] = []
beforeEach(() => {
  renders = []
})

function Child() {
  renders.push('Child')
  return <p>I have no props</p>
}

function Counter() {
  renders.push('Counter')
  const [count, setCount] = useState(0)
  return (
    <>
      <button type="button" onClick={() => setCount(count + 1)}>
        Add one
      </button>
      <button type="button" onClick={() => setCount(count)}>
        Set the same
      </button>
      <output>{count}</output>
      <Child />
    </>
  )
}

it('renders the component whose state changed, and everything inside it', async () => {
  const user = userEvent.setup()
  render(<Counter />)
  expect(renders).toEqual(['Counter', 'Child'])

  renders = []
  await user.click(screen.getByRole('button', { name: 'Add one' }))
  // Child has no props at all, yet it renders again: its parent did.
  expect(renders).toEqual(['Counter', 'Child'])
})

it('skips the render when the new state is the same value (Object.is)', async () => {
  const user = userEvent.setup()
  render(<Counter />)

  renders = []
  await user.click(screen.getByRole('button', { name: 'Set the same' }))
  expect(renders).toEqual([])
})

function Toggle({ children }: { children: ReactNode }) {
  renders.push('Toggle')
  const [on, setOn] = useState(false)
  return (
    <section>
      <button type="button" onClick={() => setOn(!on)}>
        {on ? 'On' : 'Off'}
      </button>
      {children}
    </section>
  )
}

it('does not render children that were passed in from above', async () => {
  const user = userEvent.setup()
  render(
    <Toggle>
      <Child />
    </Toggle>,
  )

  renders = []
  await user.click(screen.getByRole('button', { name: 'Off' }))
  // <Child /> was created by the test, not by Toggle: same element, no render.
  expect(renders).toEqual(['Toggle'])
})

const ScoreContext = createContext(0)

function Middle() {
  renders.push('Middle')
  return <Reader />
}

function Reader() {
  renders.push('Reader')
  return <p>Score: {useContext(ScoreContext)}</p>
}

it('renders every component that reads a context when its value changes', () => {
  const middle = <Middle />
  const { rerender } = render(<ScoreContext value={1}>{middle}</ScoreContext>)

  renders = []
  rerender(<ScoreContext value={2}>{middle}</ScoreContext>)
  // Middle is the same element, so it is skipped, but Reader reads the context.
  expect(renders).toEqual(['Reader'])
  expect(screen.getByText('Score: 2')).toBeInTheDocument()
})

it('changes only what differs in the DOM', async () => {
  const user = userEvent.setup()
  render(<Counter />)
  await user.click(screen.getByRole('button', { name: 'Add one' }))

  const changes: MutationRecord[] = []
  const observer = new MutationObserver((records) => changes.push(...records))
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true })

  renders = []
  await user.click(screen.getByRole('button', { name: 'Add one' }))
  await act(async () => {}) // let the observer report
  expect(renders).toEqual(['Counter', 'Child'])
  // Two components rendered, but only the number changed in the page.
  expect(changes.map((change) => `${change.type}: ${change.target.textContent}`)).toEqual(['characterData: 2'])
  observer.disconnect()
})
