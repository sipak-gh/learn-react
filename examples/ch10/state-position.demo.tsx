import { useState } from 'react'

function Counter({ label }: { label: string }) {
  const [count, setCount] = useState(0)
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      {label}: {count}
    </button>
  )
}

export default function StatePositionDemo() {
  const [player, setPlayer] = useState('Ada')
  const isAda = player === 'Ada'

  return (
    <main>
      <button type="button" onClick={() => setPlayer(isAda ? 'Bo' : 'Ada')}>
        Switch player
      </button>

      <h2>1. Same component, same position</h2>
      {/* Only a prop changes: React keeps the state. */}
      <Counter label={player} />

      <h2>2. A ternary: still the same position</h2>
      {isAda ? <Counter label="Ada" /> : <Counter label="Bo" />}

      <h2>3. Two different positions</h2>
      {isAda && <Counter label="Ada" />}
      {!isAda && <Counter label="Bo" />}

      <h2>4. Same position, different key</h2>
      <Counter key={player} label={player} />
    </main>
  )
}
