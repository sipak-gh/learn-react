import { useState } from 'react'

const MAX = 12

export default function Controlled() {
  // The state is the single source of truth. The input only shows it.
  const [name, setName] = useState('')

  return (
    <main>
      <label>
        Name{' '}
        <input
          value={name}
          // Every keystroke goes through state. We may change it on the way.
          onChange={(event) => setName(event.target.value.toUpperCase().slice(0, MAX))}
        />
      </label>{' '}
      <button type="button" onClick={() => setName('')}>
        Clear
      </button>
      <p>
        {name.length}/{MAX} characters. Hello, {name || 'stranger'}!
      </p>
    </main>
  )
}
