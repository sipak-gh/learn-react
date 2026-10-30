import { startTransition, useOptimistic, useState } from 'react'

/** A pretend server: saves after a second, but refuses messages with a "!". */
function save(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (text.includes('!') ? reject(new Error('No shouting.')) : resolve(text)), 1000)
  })
}

export default function OptimisticDemo() {
  const [messages, setMessages] = useState<string[]>([])
  const [error, setError] = useState('')
  // While an Action runs, `shown` is `messages` plus the optimistic additions.
  // When the Action ends, React drops the additions and shows `messages` again.
  const [shown, addOptimistic] = useOptimistic(messages, (current, text: string) => [...current, `${text} (sending…)`])

  async function send(formData: FormData) {
    const text = String(formData.get('text'))
    setError('')
    addOptimistic(text)
    try {
      const saved = await save(text)
      // After an await, wrap state updates in startTransition again.
      startTransition(() => setMessages((current) => [...current, saved]))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <main>
      <ul>
        {shown.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
      {/* A function passed to `action` runs as an Action (a transition). */}
      <form action={send}>
        <input name="text" aria-label="Message" required /> <button type="submit">Send</button>
      </form>
      {error && <p role="alert">Not sent: {error}</p>}
    </main>
  )
}
