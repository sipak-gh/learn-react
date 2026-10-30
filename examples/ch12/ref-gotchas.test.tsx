import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useRef } from 'react'
import { expect, it } from 'vitest'

// 🔴 Shows a ref's value: the screen never updates.
function ClickCounter() {
  const clicks = useRef(0)
  return (
    <button type="button" onClick={() => (clicks.current += 1)}>
      {/* oxlint-disable-next-line react/refs -- the bug we are demonstrating */}
      Clicked {clicks.current} times
    </button>
  )
}

it('does not re-render when a ref changes', async () => {
  const user = userEvent.setup()
  render(<ClickCounter />)
  await user.click(screen.getByRole('button'))
  await user.click(screen.getByRole('button'))
  expect(screen.getByRole('button')).toHaveTextContent('Clicked 0 times')
})

// 🔴 Accepts no `ref` prop, so a ref passed to it goes nowhere.
function Field({ label }: { label: string }) {
  return (
    <label>
      {label} <input />
    </label>
  )
}

it('leaves the ref empty when the component ignores it', () => {
  const nameRef = createRef<HTMLInputElement>()
  // @ts-expect-error -- Field doesn't declare a ref prop
  render(<Field ref={nameRef} label="Name" />)
  expect(nameRef.current).toBeNull()
})
