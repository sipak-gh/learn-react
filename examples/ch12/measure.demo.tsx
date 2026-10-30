import { useLayoutEffect, useRef, useState } from 'react'

export default function MeasureDemo() {
  const [text, setText] = useState('Five Dice')
  const [width, setWidth] = useState(0)
  const textRef = useRef<HTMLSpanElement>(null)

  // Runs after React updates the DOM but before the browser paints, so the
  // underline never shows the old width, not even for one frame.
  useLayoutEffect(() => {
    if (textRef.current) setWidth(textRef.current.getBoundingClientRect().width)
  }, [text])

  return (
    <main>
      <label>
        Title <input value={text} onChange={(event) => setText(event.target.value)} />
      </label>
      <h2>
        <span ref={textRef}>{text}</span>
      </h2>
      <div style={{ width, borderBottom: '4px solid tomato' }} />
      <p>Underline: {Math.round(width)} px</p>
    </main>
  )
}
