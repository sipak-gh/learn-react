import { useState, type ChangeEvent } from 'react'

export default function ControlledDemo() {
  const [name, setName] = useState('Ada')

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    // React owns the value: whatever you store is what the input shows.
    setName(e.target.value.toUpperCase())
  }

  return (
    <>
      <h1>Controlled input</h1>
      <label>
        Player name <input value={name} onChange={handleChange} />
      </label>
      <p>
        Hello, {name === '' ? 'stranger' : name}! ({name.length} characters)
      </p>
      <button type="button" onClick={() => setName('')}>
        Clear
      </button>
    </>
  )
}
