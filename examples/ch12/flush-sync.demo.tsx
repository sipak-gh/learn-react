import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

export function PlayerNames({ sync }: { sync: boolean }) {
  const [names, setNames] = useState(['Ada'])
  const listRef = useRef<HTMLOListElement>(null)

  function handleAdd() {
    const add = () => setNames([...names, ''])
    if (sync) {
      // Apply the update and change the DOM now, before the next line.
      flushSync(add)
    } else {
      add() // only queued: the DOM still has the old list
    }
    listRef.current?.querySelector<HTMLInputElement>('li:last-child input')?.focus()
  }

  return (
    <section>
      <ol ref={listRef}>
        {names.map((name, i) => (
          <li key={i}>
            <input
              aria-label={`Player ${i + 1}`}
              value={name}
              onChange={(event) => setNames(names.map((n, j) => (j === i ? event.target.value : n)))}
            />
          </li>
        ))}
      </ol>
      <button type="button" onClick={handleAdd}>
        Add player {sync ? '(flushSync)' : '(plain)'}
      </button>
    </section>
  )
}

export default function FlushSyncDemo() {
  return (
    <main>
      <PlayerNames sync={false} />
      <PlayerNames sync />
    </main>
  )
}
