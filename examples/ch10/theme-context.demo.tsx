import { createContext, useContext, useState } from 'react'

type Theme = 'light' | 'dark'

// The argument is the default: what useContext returns when no provider is above.
const ThemeContext = createContext<Theme>('light')

function Badge({ label }: { label: string }) {
  const theme = useContext(ThemeContext)
  return (
    <p>
      {label}: {theme}
    </p>
  )
}

// Toolbar neither takes nor passes a theme prop.
function Toolbar() {
  return (
    <div>
      <Badge label="Badge in the toolbar" />
    </div>
  )
}

export default function ThemeContextDemo() {
  const [theme, setTheme] = useState<Theme>('dark')

  return (
    <main>
      <Badge label="Badge outside any provider" />
      <ThemeContext value={theme}>
        <Toolbar />
        {/* The nearest provider wins. */}
        <ThemeContext value="light">
          <Badge label="Badge under a nested provider" />
        </ThemeContext>
      </ThemeContext>
      <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle theme
      </button>
    </main>
  )
}
