import { useState } from 'react'

function MirroredScore({ score }: { score: number }) {
  // Copies the prop into state on the first render, and never again.
  const [shown] = useState(score)
  return <p>Mirrored in state: {shown}</p>
}

function DirectScore({ score }: { score: number }) {
  return <p>Read from props: {score}</p>
}

export default function MirrorDemo() {
  const [score, setScore] = useState(10)

  return (
    <>
      <h1>Props in state</h1>
      <button type="button" onClick={() => setScore(score + 5)}>
        +5
      </button>
      <MirroredScore score={score} />
      <DirectScore score={score} />
    </>
  )
}
