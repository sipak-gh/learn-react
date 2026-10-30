import { useSyncExternalStore } from 'react'

// Components using this hook in this tab. localStorage has no "changed" event
// for the tab that made the change, so we notify them ourselves.
const listeners = new Set<() => void>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  // The `storage` event fires when *another* tab changes localStorage.
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

/**
 * Like useState, but the value lives in localStorage: it survives reloads and
 * stays in sync across every component (and tab) that uses the same key.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // The snapshot is the raw string: strings compare by value, so React only
  // re-renders when the stored text actually changes.
  const json = useSyncExternalStore(subscribe, () => localStorage.getItem(key))

  let value = initialValue
  if (json !== null) {
    try {
      value = JSON.parse(json) as T
    } catch {
      // Corrupt data: fall back to the initial value.
    }
  }

  function setValue(next: T) {
    localStorage.setItem(key, JSON.stringify(next))
    for (const listener of listeners) listener()
  }

  return [value, setValue]
}
