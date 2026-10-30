import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import buttons from '../styles/buttons.module.css'
import styles from './Dialog.module.css'

interface DialogProps {
  title: string
  /** Called after the dialog closed itself: the Close button, or Escape. */
  onClose: () => void
  children: ReactNode
  /** Buttons at the bottom. */
  footer?: ReactNode
}

/**
 * A modal dialog, built on the browser's own <dialog> element. Render it to
 * open it; the parent removes it again in `onClose`.
 */
export function Dialog({ title, onClose, children, footer }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    // showModal() puts the dialog on top of everything (the "top layer"),
    // makes the rest of the page inert, moves focus into the dialog and lets
    // Escape close it. The `open` check matters in StrictMode, which runs
    // this Effect twice in development.
    if (dialog && !dialog.open) dialog.showModal()
    // No cleanup needed: a dialog that is removed from the page is closed.
  }, [])

  // A portal renders the dialog as a child of <body>, outside the app's own
  // DOM tree, wherever <Dialog> is used. In React's tree it stays where it is:
  // it still reads context, and its events still bubble to its React parents.
  return createPortal(
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onClose={onClose}>
      <header className={styles.header}>
        <h2 id={titleId}>{title}</h2>
        {/* close() closes the dialog the browser's way: it fires the "close"
            event (handled above, as for Escape) and moves focus back to
            where it was before the dialog opened. */}
        <button type="button" className={buttons.secondary} onClick={() => dialogRef.current?.close()}>
          Close
        </button>
      </header>
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </dialog>,
    document.body,
  )
}
