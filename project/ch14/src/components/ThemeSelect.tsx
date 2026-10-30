import { useTheme, type Theme } from '../hooks/useTheme'
import styles from './ThemeSelect.module.css'

export function ThemeSelect() {
  const [theme, setTheme] = useTheme()

  return (
    <label className={styles.label}>
      Theme
      <select
        className={styles.select}
        value={theme}
        onChange={(event) => setTheme(event.target.value as Theme)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  )
}
