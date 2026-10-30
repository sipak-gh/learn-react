import { useEffect, useState } from 'react'

// 🔴 Adds a new listener on every mount and never removes it.
function Leaky() {
  useEffect(() => {
    window.addEventListener('keydown', (event) => console.log(`leaky saw ${event.key}`))
  }, [])
  return <p>Leaky is listening.</p>
}

// ✅ Cleanup removes the same function that setup added.
function Tidy() {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      console.log(`tidy saw ${event.key}`)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  return <p>Tidy is listening.</p>
}

export default function KeyListener() {
  const [shown, setShown] = useState(true)

  return (
    <main>
      <button type="button" onClick={() => setShown(!shown)}>
        {shown ? 'Hide' : 'Show'}
      </button>
      {shown && (
        <>
          <Leaky />
          <Tidy />
        </>
      )}
    </main>
  )
}
