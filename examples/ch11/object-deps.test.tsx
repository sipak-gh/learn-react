import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import { expect, it } from 'vitest'

// Every room we connected to, in order.
let connected: string[] = []

// A pretend connection. Returns the function that disconnects.
function connect(options: { serverUrl: string; roomId: string }) {
  connected.push(options.roomId)
  return () => {}
}

// 🔴 An object built during render is a new object every render.
function ChatWithObjectDep({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState('')
  const options = { serverUrl: 'https://chat.example', roomId }
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- the bug we are demonstrating
  useEffect(() => connect(options), [options])
  return <input aria-label="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
}

// ✅ Build the object inside the Effect and depend on the string.
function ChatWithStringDep({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState('')
  useEffect(() => {
    const options = { serverUrl: 'https://chat.example', roomId }
    return connect(options)
  }, [roomId])
  return <input aria-label="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
}

it.each([
  ['an object dependency', ChatWithObjectDep, ['general', 'general', 'general', 'general']],
  ['a string dependency', ChatWithStringDep, ['general']],
])('connects with %s', async (_name, Chat, expected) => {
  connected = []
  const user = userEvent.setup()
  render(<Chat roomId="general" />)
  await user.type(screen.getByRole('textbox', { name: 'Message' }), 'hi!')
  expect(connected).toEqual(expected)
})
