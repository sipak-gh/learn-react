import { useSyncExternalStore } from 'react'

/** true while the CSS media query matches. Re-renders the caller when that changes. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    // subscribe: start listening, and return a function that stops listening.
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    // getSnapshot: read the current value. A boolean, so equal values compare equal.
    () => window.matchMedia(query).matches,
  )
}
