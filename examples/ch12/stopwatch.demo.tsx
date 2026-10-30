import { useRef, useState } from 'react'

export default function Stopwatch() {
  // Shown on screen, so state: changing it must re-render.
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState<number | null>(null)
  // Never shown, only needed to stop the interval, so a ref: no re-render.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function handleStart() {
    setStartedAt(Date.now())
    setNow(Date.now())
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => setNow(Date.now()), 10)
  }

  function handleStop() {
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  const seconds = startedAt !== null && now !== null ? (now - startedAt) / 1000 : 0

  return (
    <main>
      <p>Time: {seconds.toFixed(2)} s</p>
      <button type="button" onClick={handleStart}>
        Start
      </button>{' '}
      <button type="button" onClick={handleStop}>
        Stop
      </button>
    </main>
  )
}
