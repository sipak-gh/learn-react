import { Fragment, useRef, type FragmentInstance } from 'react'

// Renders three sibling buttons with no wrapper element and no ref prop.
function Dice() {
  return [1, 2, 3].map((n) => (
    <button key={n} type="button">
      Die {n}
    </button>
  ))
}

export default function FragmentRefDemo() {
  const dice = useRef<FragmentInstance>(null)
  return (
    <main>
      <p>
        <button type="button" onClick={() => dice.current?.focus()}>
          Focus the first die
        </button>
        <button type="button" onClick={() => dice.current?.focusLast()}>
          Focus the last die
        </button>
      </p>
      <p>
        <Fragment ref={dice}>
          <Dice />
        </Fragment>
      </p>
    </main>
  )
}
