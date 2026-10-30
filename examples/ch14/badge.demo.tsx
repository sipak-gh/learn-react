import styles from './badge.module.css'

export default function BadgeDemo() {
  return (
    <main>
      <p>
        <span className={styles.badge}>New</span> <span className={styles.warning}>Beta</span>{' '}
        {/* Two classes from one module: join them with a space. */}
        <span className={`${styles.warning} ${styles.large}`}>Big beta</span>
      </p>
      {/* The module object maps each class name in the file to its real, renamed class. */}
      <pre>{JSON.stringify(styles, null, 2)}</pre>
    </main>
  )
}
