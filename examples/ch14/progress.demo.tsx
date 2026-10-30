import { useState, type CSSProperties } from 'react'
import styles from './progress.module.css'

export default function ProgressDemo() {
  const [percent, setPercent] = useState(30)

  // An inline style is an object with camelCase keys. Numbers mean pixels
  // for most properties, so build other units as strings.
  const barStyle = {
    width: `${percent}%`,
    // A custom property: CSSProperties doesn't know about it, hence the cast.
    '--hue': (percent / 100) * 120,
  } as CSSProperties

  return (
    <main>
      <div className={styles.track}>
        <div className={styles.bar} style={barStyle} />
      </div>
      <label>
        Progress{' '}
        <input type="range" min={0} max={100} value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
      </label>
      <p style={{ marginTop: 8, color: 'gray' }}>{percent}%</p>
    </main>
  )
}
