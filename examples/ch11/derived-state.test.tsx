import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import { expect, it } from 'vitest'

// What each render showed, in order. (Pushing to an outer array during render
// is impure; it's fine for a measurement like this, never in real code.)
let shown: string[] = []

// 🔴 Redundant state, kept in sync by an Effect.
function FullNameWithEffect() {
  const [first, setFirst] = useState('Ada')
  const [fullName, setFullName] = useState('')
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- the anti-pattern we are measuring
    setFullName(`${first} Lovelace`)
  }, [first])
  shown.push(fullName)
  return <input aria-label="First name" value={first} onChange={(e) => setFirst(e.target.value)} />
}

// ✅ Derived during render.
function FullNameDerived() {
  const [first, setFirst] = useState('Ada')
  const fullName = `${first} Lovelace`
  shown.push(fullName)
  return <input aria-label="First name" value={first} onChange={(e) => setFirst(e.target.value)} />
}

it.each([
  ['with an Effect', FullNameWithEffect, ['', 'Ada Lovelace', 'Ada Lovelace', 'Adam Lovelace']],
  ['derived', FullNameDerived, ['Ada Lovelace', 'Adam Lovelace']],
])('full name %s', async (_name, Component, expected) => {
  shown = []
  const user = userEvent.setup()
  render(<Component />)
  await user.type(screen.getByRole('textbox', { name: 'First name' }), 'm')
  expect(shown).toEqual(expected)
})
