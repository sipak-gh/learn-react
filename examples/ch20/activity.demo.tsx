import { Activity, useState } from 'react'

function Notes({ label }: { label: string }) {
  const [text, setText] = useState('')
  return (
    <label>
      {label} <input value={text} onChange={(event) => setText(event.target.value)} />
    </label>
  )
}

export default function ActivityDemo() {
  const [open, setOpen] = useState(true)
  return (
    <main>
      <button type="button" onClick={() => setOpen(!open)}>
        {open ? 'Hide notes' : 'Show notes'}
      </button>
      {/* Hidden, not removed: the state survives. */}
      <Activity mode={open ? 'visible' : 'hidden'}>
        <p>
          <Notes label="Kept" />
        </p>
      </Activity>
      {/* Removed: the state is thrown away. */}
      {open && (
        <p>
          <Notes label="Lost" />
        </p>
      )}
    </main>
  )
}
