import { useEffect, useState } from 'react'

// A pretend external system: think of a socket to a chat server.
function createConnection(roomId: string) {
  return {
    connect: () => console.log(`connect to "${roomId}"`),
    disconnect: () => console.log(`disconnect from "${roomId}"`),
  }
}

function ChatRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    // Setup: start synchronising with the external system.
    const connection = createConnection(roomId)
    connection.connect()
    // Cleanup: stop synchronising. React runs it before the next setup and on unmount.
    return () => connection.disconnect()
  }, [roomId]) // Re-synchronise whenever roomId changes.

  return <p>Welcome to the {roomId} room.</p>
}

export default function ChatRoomDemo() {
  const [roomId, setRoomId] = useState('general')
  const [open, setOpen] = useState(true)

  return (
    <main>
      <label>
        Room{' '}
        <select value={roomId} onChange={(event) => setRoomId(event.target.value)}>
          <option value="general">general</option>
          <option value="travel">travel</option>
        </select>
      </label>{' '}
      <button type="button" onClick={() => setOpen(!open)}>
        {open ? 'Close chat' : 'Open chat'}
      </button>
      {open && <ChatRoom roomId={roomId} />}
    </main>
  )
}
