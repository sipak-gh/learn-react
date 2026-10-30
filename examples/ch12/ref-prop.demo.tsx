import { useImperativeHandle, useRef, type ComponentProps, type Ref } from 'react'

// React 19: `ref` is an ordinary prop. ComponentProps<'input'> already
// includes it, so it arrives with the rest and goes on to the <input>.
function TextField({ label, ...inputProps }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className="field">
      {label} <input {...inputProps} />
    </label>
  )
}

/** The only things a parent may do with a SearchBox. */
export interface SearchBoxHandle {
  focus: () => void
  clear: () => void
}

// useImperativeHandle: expose a small custom object instead of the DOM node.
function SearchBox({ ref }: { ref?: Ref<SearchBoxHandle> }) {
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => {
      if (inputRef.current) inputRef.current.value = ''
    },
  }))
  return <input ref={inputRef} aria-label="Search" defaultValue="dice" />
}

export default function RefPropDemo() {
  const nameRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<SearchBoxHandle>(null)

  return (
    <main>
      <TextField ref={nameRef} label="Name" />
      <button type="button" onClick={() => nameRef.current?.focus()}>
        Focus name
      </button>
      <SearchBox ref={searchRef} />
      <button
        type="button"
        onClick={() => {
          searchRef.current?.clear()
          searchRef.current?.focus()
        }}
      >
        New search
      </button>
    </main>
  )
}
