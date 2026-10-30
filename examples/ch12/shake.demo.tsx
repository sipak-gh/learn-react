import { useRef, useState, type FormEvent } from 'react'

const SHAKE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-8px)' },
  { transform: 'translateX(8px)' },
  { transform: 'translateX(-8px)' },
  { transform: 'translateX(0)' },
]

export default function ShakeDemo() {
  const [greeting, setGreeting] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = inputRef.current
    if (!input) return
    if (input.value.trim() === '') {
      input.focus()
      // Respect the user's "reduce motion" setting.
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        input.animate(SHAKE, { duration: 300, easing: 'ease-in-out' })
      }
      return
    }
    setGreeting(`Hello, ${input.value}!`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name <input ref={inputRef} />
      </label>{' '}
      <button type="submit">Join</button>
      <p>{greeting}</p>
    </form>
  )
}
