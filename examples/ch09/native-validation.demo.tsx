import { useState } from 'react'

function JoinForm({ noValidate }: { noValidate: boolean }) {
  const [joined, setJoined] = useState<string[]>([])

  function join(formData: FormData) {
    setJoined([...joined, String(formData.get('email'))])
  }

  return (
    <section>
      <h2>{noValidate ? 'noValidate' : 'Browser checks'}</h2>
      <form action={join} noValidate={noValidate}>
        <label>
          Email <input type="email" name="email" required />
        </label>{' '}
        <button type="submit">Join</button>
      </form>
      <p>Joined: {joined.map((email) => `"${email}"`).join(', ') || 'nobody yet'}</p>
    </section>
  )
}

export default function NativeValidation() {
  return (
    <main>
      <JoinForm noValidate={false} />
      <JoinForm noValidate />
    </main>
  )
}
