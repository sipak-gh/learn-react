import { useState } from 'react'

export default function DivButtonDemo() {
  const [divCount, setDivCount] = useState(0)
  const [buttonCount, setButtonCount] = useState(0)

  return (
    <main>
      {/* Looks clickable, but only to a mouse. */}
      <div className="fake-button" onClick={() => setDivCount((n) => n + 1)}>
        Roll (div)
      </div>
      <p>Div clicks: {divCount}</p>

      {/* Focusable, works with Enter and Space, announced as "button". */}
      <button type="button" onClick={() => setButtonCount((n) => n + 1)}>
        Roll (button)
      </button>
      <p>Button clicks: {buttonCount}</p>
    </main>
  )
}
