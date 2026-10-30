import { useState, type FormEvent } from 'react'

export default function Search() {
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue>>()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Without this line the browser sends the form itself and loads a new page.
    event.preventDefault()
    // Read every named field of the form. The inputs are uncontrolled:
    // React never stored what was typed; the DOM did.
    const formData = new FormData(event.currentTarget)
    setSubmitted(Object.fromEntries(formData))
  }

  return (
    <main>
      <h2>With preventDefault</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Search <input name="query" defaultValue="dice" />
        </label>{' '}
        <label>
          <input type="checkbox" name="exact" /> Exact match
        </label>{' '}
        <button type="submit">Search</button>
      </form>
      <pre>{JSON.stringify(submitted)}</pre>

      <h2>Without preventDefault</h2>
      {/* No handler: the browser does what forms did before JavaScript. */}
      <form>
        <label>
          Search <input name="query" defaultValue="dice" />
        </label>{' '}
        <button type="submit">Search</button>
      </form>
    </main>
  )
}
