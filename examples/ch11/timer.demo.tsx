import { useEffect, useState } from 'react'

export default function TimerDemo() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return // nothing to synchronise, so no cleanup either
    const id = setInterval(() => {
      // An updater function: reads the latest value, so `seconds`
      // doesn't have to be a dependency.
      setSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  return (
    <main>
      <p>{seconds} s</p>
      <button type="button" onClick={() => setRunning(!running)}>
        {running ? 'Pause' : 'Start'}
      </button>
    </main>
  )
}
