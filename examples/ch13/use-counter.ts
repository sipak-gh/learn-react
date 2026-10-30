import { useState } from 'react'

/** A number that counts up in steps, with a reset. A custom Hook: a function that calls Hooks. */
export function useCounter(step = 1) {
  const [count, setCount] = useState(0)

  return {
    count,
    increment: () => setCount((c) => c + step),
    reset: () => setCount(0),
  }
}
