import { createContext, useContext, useState } from 'react'
import { createPortal } from 'react-dom'

const UserContext = createContext('nobody')

const card = { position: 'relative', height: '3rem', overflow: 'hidden', border: '2px dashed gray' } as const
const toastStyle = { position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '1rem', background: 'gold' } as const

function Toast({ inPortal }: { inPortal: boolean }) {
  const user = useContext(UserContext) // context still arrives through a portal
  const toast = (
    <div role="status" style={toastStyle}>
      <p>Saved, {user}!</p>
      <button type="button">OK</button>
    </div>
  )
  // createPortal(jsx, domNode): render the JSX into domNode instead of here.
  return inPortal ? createPortal(toast, document.body) : toast
}

export default function PortalDemo() {
  const [inPortal, setInPortal] = useState(true)
  const [clicks, setClicks] = useState(0)

  return (
    <UserContext value="Ada">
      {/* Clicks anywhere inside <main> in the React tree bubble up to here. */}
      <main onClick={() => setClicks(clicks + 1)}>
        <label>
          <input type="checkbox" checked={inPortal} onChange={(e) => setInPortal(e.target.checked)} /> Render the
          toast with createPortal
        </label>
        <p>Clicks seen by &lt;main&gt;: {clicks}</p>
        <div style={card}>
          A card with overflow: hidden
          <Toast inPortal={inPortal} />
        </div>
      </main>
    </UserContext>
  )
}
