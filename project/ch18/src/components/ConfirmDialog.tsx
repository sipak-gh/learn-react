import type { ReactNode } from 'react'
import buttons from '../styles/buttons.module.css'
import { Dialog } from './Dialog'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  /** Called when the player backs out: Cancel, Close or Escape. */
  onCancel: () => void
}

/** "Are you sure?" A dialog with a Cancel and a confirm button. */
export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog
      title={title}
      onClose={onCancel}
      footer={
        <>
          {/* Close the surrounding <dialog>, just like its Close button. */}
          <button
            type="button"
            className={buttons.secondary}
            onClick={(event) => event.currentTarget.closest('dialog')?.close()}
          >
            Cancel
          </button>
          <button type="button" className={buttons.primary} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </Dialog>
  )
}
