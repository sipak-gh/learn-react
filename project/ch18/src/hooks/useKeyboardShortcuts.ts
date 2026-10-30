import { useEffect, useEffectEvent } from 'react'

/** Maps a key (as in KeyboardEvent.key, but "Space" for " ") to what it does. */
export type Shortcuts = Record<string, () => void>

/**
 * Run `shortcuts[key]` when that key is pressed anywhere on the page,
 * except while typing in a form field or using a dialog.
 */
export function useKeyboardShortcuts(shortcuts: Shortcuts): void {
  // Always sees the latest `shortcuts` without re-subscribing.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target
    if (target instanceof Element && target.closest('input, select, textarea, dialog')) return

    const key = event.key === ' ' ? 'Space' : event.key
    const action = shortcuts[key]
    if (!action) return
    // Space on a focused button already clicks that button.
    if (key === 'Space' && target instanceof HTMLButtonElement) return
    event.preventDefault() // e.g. stop Space from scrolling the page
    action()
  })

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
