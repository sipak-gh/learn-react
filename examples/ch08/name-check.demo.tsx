import { useState, type FormEvent } from 'react'

type Status = 'idle' | 'checking' | 'available' | 'taken'

interface NameCheckProps {
  /** Asks a server whether the name is free. Tests pass a fake. */
  checkName?: (name: string) => Promise<boolean>
}

const TAKEN = ['ada', 'bo']

// Pretends to be a server that needs half a second to answer.
function fakeServer(name: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(!TAKEN.includes(name.toLowerCase())), 500)
  })
}

export default function NameCheck({ checkName = fakeServer }: NameCheckProps) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('checking')
    const free = await checkName(name)
    setStatus(free ? 'available' : 'taken')
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        User name{' '}
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setStatus('idle')
          }}
        />
      </label>{' '}
      <button type="submit" disabled={name === '' || status === 'checking'}>
        Check
      </button>
      {status === 'checking' && <p>Checking…</p>}
      {status === 'available' && <p>{name} is available.</p>}
      {status === 'taken' && <p>{name} is taken.</p>}
    </form>
  )
}
