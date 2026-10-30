import { useId, type ReactNode, type Ref } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  title: string
  /** Pass a ref to move focus to the title from code. */
  titleRef?: Ref<HTMLHeadingElement>
  /** Whatever JSX is nested between <Panel> and </Panel>. */
  children: ReactNode
}

export function Panel({ title, titleRef, children }: PanelProps) {
  const titleId = useId()
  return (
    // A <section> with an accessible name is a "region" landmark: screen
    // reader users can jump straight to it, e.g. to "Scorecard".
    <section className={styles.panel} aria-labelledby={titleId}>
      {/* tabIndex={-1}: focusable from code, but not a Tab stop. */}
      <h2 id={titleId} ref={titleRef} tabIndex={titleRef ? -1 : undefined} className={styles.title}>
        {title}
      </h2>
      {children}
    </section>
  )
}
