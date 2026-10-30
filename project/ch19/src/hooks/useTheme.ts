import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export type Theme = 'system' | 'light' | 'dark'

/** The user's theme choice, saved in localStorage and applied to <html>. */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('five-dice:theme', 'system')

  // <html data-theme="dark"> switches the CSS variables (see index.css).
  // <html> lives outside our React tree, so we synchronise it with an Effect.
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      delete root.dataset.theme
    } else {
      root.dataset.theme = theme
    }
  }, [theme])

  return [theme, setTheme] as const
}
