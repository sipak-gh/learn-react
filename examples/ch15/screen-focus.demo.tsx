import { useRef, useState, type Ref } from 'react'
import { flushSync } from 'react-dom'

interface ScreenProps {
  headingRef: Ref<HTMLHeadingElement>
  onDone: () => void
}

function Menu({ headingRef, onDone }: ScreenProps) {
  return (
    <main>
      {/* tabIndex={-1}: focusable from code, but not a Tab stop. */}
      <h1 ref={headingRef} tabIndex={-1}>
        Menu
      </h1>
      <button type="button" onClick={onDone}>
        Start game
      </button>
    </main>
  )
}

function Game({ headingRef, onDone }: ScreenProps) {
  return (
    <main>
      <h1 ref={headingRef} tabIndex={-1}>
        Game
      </h1>
      <button type="button" onClick={onDone}>
        Quit
      </button>
    </main>
  )
}

export default function ScreenFocusDemo({ moveFocus = true }: { moveFocus?: boolean }) {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu')
  // Whichever screen is showing attaches its heading here.
  const headingRef = useRef<HTMLHeadingElement>(null)

  function show(next: 'menu' | 'game') {
    if (!moveFocus) {
      setScreen(next)
      return
    }
    // Put the new screen on the page now, then focus its heading.
    flushSync(() => setScreen(next))
    headingRef.current?.focus()
  }

  return screen === 'menu' ? (
    <Menu headingRef={headingRef} onDone={() => show('game')} />
  ) : (
    <Game headingRef={headingRef} onDone={() => show('menu')} />
  )
}
