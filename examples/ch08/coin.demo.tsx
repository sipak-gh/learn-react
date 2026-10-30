import { useState } from 'react'

type Side = 'Heads' | 'Tails'

interface CoinProps {
  /** Returns a number in [0, 1), like Math.random. Tests pass a fake. */
  rng?: () => number
}

export default function Coin({ rng = Math.random }: CoinProps) {
  const [sides, setSides] = useState<Side[]>([])

  function flip() {
    const side: Side = rng() < 0.5 ? 'Heads' : 'Tails'
    setSides([...sides, side])
  }

  const last = sides.at(-1)
  return (
    <main>
      <h1>Coin flip</h1>
      <p role="status">{last ?? 'Not flipped yet'}</p>
      <p>Flips: {sides.length}</p>
      <button type="button" onClick={flip}>
        Flip
      </button>
      {sides.length > 0 && (
        <button type="button" onClick={() => setSides([])}>
          Reset
        </button>
      )}
    </main>
  )
}
