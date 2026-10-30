import { lazy, Suspense, useState } from 'react'

// Declared once, at the top level of the module, never inside a component.
// The import() runs the first time React renders <DiceStats />.
const DiceStats = lazy(() => import('./DiceStats.tsx'))

export default function LazyDemo() {
  const [shown, setShown] = useState(false)

  return (
    <main>
      <button type="button" disabled={shown} onClick={() => setShown(true)}>
        Show statistics
      </button>
      {shown && (
        <Suspense fallback={<p>Loading statistics…</p>}>
          <DiceStats />
        </Suspense>
      )}
    </main>
  )
}
