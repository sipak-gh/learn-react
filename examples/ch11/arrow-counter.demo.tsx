import { useEffect, useEffectEvent, useState } from 'react'

/** Press the arrow keys to move by `step`. */
export default function ArrowCounter() {
  const [count, setCount] = useState(0)
  const [step, setStep] = useState(1)

  // An Effect Event: always sees the latest `step`, but is not reactive,
  // so changing `step` does not re-subscribe the listener below.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'ArrowUp') setCount((c) => c + step)
    if (event.key === 'ArrowDown') setCount((c) => c - step)
  })

  useEffect(() => {
    console.log('subscribe keydown')
    window.addEventListener('keydown', onKeyDown)
    return () => {
      console.log('unsubscribe keydown')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <main>
      <p>Count: {count}</p>
      <button type="button" onClick={() => setStep(step === 1 ? 10 : 1)}>
        Step: {step}
      </button>
      <p>Press ↑ or ↓.</p>
    </main>
  )
}
