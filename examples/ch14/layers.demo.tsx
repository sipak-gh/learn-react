// This component's own module is imported first, so the shared modules'
// rules come later in the page's CSS.
import styles from './layers.module.css'
import layered from './shared-layered.module.css'
import plain from './shared-plain.module.css'

export default function LayersDemo() {
  return (
    <main>
      <p>
        {/* 🔴 styles.quiet is last in className, but plain.primary's rules come later in the CSS, so they win. */}
        <button type="button" className={`${plain.primary} ${styles.quiet}`}>
          Unlayered
        </button>{' '}
        {/* Unlayered styles.quiet beats anything in a layer. */}
        <button type="button" className={`${layered.primary} ${styles.quiet}`}>
          Layered
        </button>
      </p>
    </main>
  )
}
