import type { MouseEvent, SubmitEvent } from 'react'

interface RollButtonProps {
  // Props that take event handlers are named onSomething.
  onRoll: () => void
}

function RollButton({ onRoll }: RollButtonProps) {
  return (
    <button type="button" onClick={onRoll}>
      Roll
    </button>
  )
}

export default function EventsDemo() {
  // The functions that handle them are named handleSomething.
  function handleRoll() {
    console.log('roll')
  }

  function handleHold(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation() // the toolbar's onClick will not run
    console.log('hold, button text:', e.currentTarget.textContent)
  }

  function handleToolbarClick(e: MouseEvent<HTMLDivElement>) {
    const target = e.target instanceof HTMLElement ? e.target.tagName : '?'
    console.log('toolbar click, target:', target, 'currentTarget:', e.currentTarget.className)
  }

  function handleLinkClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault() // no navigation
    console.log('link click, default prevented:', e.defaultPrevented)
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault() // no page reload
    console.log('submit, native event:', e.nativeEvent.constructor.name)
  }

  return (
    <>
      <h1>Events</h1>
      <div className="toolbar" onClick={handleToolbarClick}>
        <RollButton onRoll={handleRoll} />
        <button type="button" onClick={handleHold}>
          Hold
        </button>
      </div>
      <p>
        <a href="https://react.dev" onClick={handleLinkClick}>
          react.dev
        </a>
      </p>
      <form onSubmit={handleSubmit}>
        <button type="submit">Save</button>
      </form>
    </>
  )
}
