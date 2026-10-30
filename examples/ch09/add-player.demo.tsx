import { useState, type FormEvent } from 'react'

function WithOnSubmit() {
  const [players, setPlayers] = useState<string[]>([])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const name = String(new FormData(form).get('name')).trim()
    if (name !== '') setPlayers([...players, name])
    form.reset()
  }

  return (
    <section>
      <h2>onSubmit</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Name <input name="name" />
        </label>{' '}
        <button type="submit">Add</button>
      </form>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ul>
    </section>
  )
}

function WithAction() {
  const [players, setPlayers] = useState<string[]>([])

  function addPlayer(formData: FormData) {
    const name = String(formData.get('name')).trim()
    if (name !== '') setPlayers([...players, name])
  }

  return (
    <section>
      <h2>action</h2>
      <form action={addPlayer}>
        <label>
          Name <input name="name" />
        </label>{' '}
        <button type="submit">Add</button>
      </form>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ul>
    </section>
  )
}

export default function AddPlayer() {
  return (
    <main>
      <WithOnSubmit />
      <WithAction />
    </main>
  )
}
