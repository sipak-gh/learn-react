import { useState } from 'react'

function BrokenCounter() {
  // A plain local variable: reset to 0 every time React calls this function.
  let count = 0

  function handleClick() {
    // oxlint-disable-next-line react/immutability -- broken on purpose, to show the problem
    count = count + 1
    console.log('broken count is now', count)
  }

  return (
    <button type="button" onClick={handleClick}>
      Broken count: {count}
    </button>
  )
}

function Counter() {
  // State: React keeps the value between renders, per component instance.
  const [count, setCount] = useState(0)

  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}

export default function CounterDemo() {
  return (
    <>
      <h1>Counters</h1>
      <p>
        <BrokenCounter />
      </p>
      <p>
        <Counter /> <Counter />
      </p>
    </>
  )
}
