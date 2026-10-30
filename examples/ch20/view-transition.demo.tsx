import { startTransition, useState, ViewTransition } from 'react'

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

export default function ViewTransitionDemo() {
  const [face, setFace] = useState(0)
  const roll = () => Math.floor(Math.random() * 6)

  return (
    <main>
      {/* key: a new face is a new element, so the old one exits and the new one enters. */}
      <ViewTransition key={face}>
        <p style={{ fontSize: '6rem', margin: 0 }}>{FACES[face]}</p>
      </ViewTransition>
      {/* Only updates inside a Transition (or a Suspense reveal) animate. */}
      <button type="button" onClick={() => startTransition(() => setFace(roll()))}>
        Roll with a cross-fade
      </button>
      <button type="button" onClick={() => setFace(roll())}>
        Roll instantly
      </button>
    </main>
  )
}
