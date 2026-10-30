import { useRef } from 'react'

const box = { position: 'relative', height: '4rem', overflow: 'hidden', border: '2px dashed gray' } as const

export default function TopLayerDemo() {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <main>
      <button type="button" onClick={() => dialogRef.current?.show()}>
        show()
      </button>{' '}
      <button type="button" onClick={() => dialogRef.current?.showModal()}>
        showModal()
      </button>
      <p>The dialog is inside this box, which has overflow: hidden:</p>
      <div style={box}>
        <dialog ref={dialogRef} aria-label="Hello">
          <p>Hello from the dialog!</p>
          <p>Is this line cut off?</p>
          <button type="button" onClick={() => dialogRef.current?.close()}>
            Close
          </button>
        </dialog>
      </div>
    </main>
  )
}
