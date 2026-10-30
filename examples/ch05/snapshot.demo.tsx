import { useState } from 'react'

export default function SnapshotDemo() {
  const [score, setScore] = useState(0)
  console.log('render with score =', score)

  function handlePlusThree() {
    setScore(score + 1)
    setScore(score + 1)
    setScore(score + 1)
    console.log('+3 handler: score is still', score)
  }

  function handleUpdaterPlusThree() {
    setScore((s) => s + 1)
    setScore((s) => s + 1)
    setScore((s) => s + 1)
  }

  function handleDelayedLog() {
    setScore(score + 10)
    setTimeout(() => {
      console.log('one second later, this handler still sees', score)
    }, 1000)
  }

  return (
    <>
      <h1>Score: {score}</h1>
      <button type="button" onClick={handlePlusThree}>
        +3?
      </button>{' '}
      <button type="button" onClick={handleUpdaterPlusThree}>
        +3 with updaters
      </button>{' '}
      <button type="button" onClick={handleDelayedLog}>
        +10, then log
      </button>
    </>
  )
}
