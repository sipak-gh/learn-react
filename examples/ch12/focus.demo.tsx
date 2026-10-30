import { useRef } from 'react'

export default function FocusDemo() {
  // A box React fills in: null now, the <input> element after the commit.
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <main>
      <input ref={inputRef} aria-label="Name" />
      <button type="button" onClick={() => inputRef.current?.focus()}>
        Edit name
      </button>
    </main>
  )
}
