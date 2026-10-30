import { useState } from 'react'

export default function ReadOnlyBug() {
  // undefined at first, a string after the first keystroke.
  const [nickname, setNickname] = useState<string>()

  return (
    <main>
      <p>
        {/* BUG 1: a value without onChange. You can't type here. */}
        <label>
          Name <input value="Ada" />
        </label>
      </p>
      <p>
        {/* BUG 2: value={undefined} means "uncontrolled". The first keystroke makes it controlled. */}
        <label>
          Nickname <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
        </label>
      </p>
    </main>
  )
}
