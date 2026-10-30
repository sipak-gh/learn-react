import { useState } from 'react'

export default function LiveRegionDemo() {
  const [message, setMessage] = useState('')

  function roll() {
    const value = Math.floor(Math.random() * 6) + 1
    setMessage(`You rolled ${value}.`)
  }

  return (
    <main>
      <button type="button" onClick={roll}>
        Roll
      </button>
      {/* Always rendered, empty at first: screen readers watch it for changes
          and read the new text without moving focus. */}
      <p role="status">{message}</p>
    </main>
  )
}
