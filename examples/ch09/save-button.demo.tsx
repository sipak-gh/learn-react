import { startTransition, useActionState } from 'react'

interface SaveButtonProps {
  /** How long the fake server takes, in milliseconds. */
  delay?: number
}

export default function SaveButton({ delay = 1000 }: SaveButtonProps) {
  // The payload can be anything, not only FormData.
  async function save(total: number, points: number): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, delay))
    return total + points
  }

  const [total, addPoints, isPending] = useActionState(save, 0)

  return (
    <main>
      <p>Saved: {total} points</p>
      <button type="button" onClick={() => startTransition(() => addPoints(10))}>
        Save 10 points
      </button>
      {isPending && <p>Saving…</p>}
    </main>
  )
}
