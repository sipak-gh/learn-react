import { memo, useDeferredValue, useState } from 'react'

/** Stands in for expensive rendering work: just waits `ms` milliseconds. */
function busyWait(ms: number) {
  const end = performance.now() + ms
  while (performance.now() < end) {}
}

function SlowItem({ text, index }: { text: string; index: number }) {
  busyWait(1)
  return (
    <li>
      {text} #{index + 1}
    </li>
  )
}

// memo matters: during the urgent render, SlowList gets the old text and is skipped.
const SlowList = memo(function SlowList({ text }: { text: string }) {
  console.log(`SlowList "${text}"`)
  return (
    <ul>
      {Array.from({ length: 200 }, (_, index) => (
        <SlowItem key={index} text={text} index={index} />
      ))}
    </ul>
  )
})

export default function DeferredDemo() {
  const [text, setText] = useState('')
  const [defer, setDefer] = useState(true)
  const deferredText = useDeferredValue(text)
  const listText = defer ? deferredText : text

  return (
    <main>
      <label>
        Search: <input value={text} onChange={(e) => setText(e.target.value)} />
      </label>{' '}
      <label>
        <input type="checkbox" checked={defer} onChange={(e) => setDefer(e.target.checked)} /> useDeferredValue
      </label>
      {/* Dim the list while it shows an older value. */}
      <div style={{ opacity: listText === text ? 1 : 0.5 }}>
        <SlowList text={listText} />
      </div>
    </main>
  )
}
