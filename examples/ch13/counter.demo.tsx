import { useCounter } from './use-counter'

function Counter({ label, step }: { label: string; step: number }) {
  // Each component that calls useCounter gets its own, separate state.
  const { count, increment, reset } = useCounter(step)
  return (
    <p>
      {label}: {count}{' '}
      <button type="button" onClick={increment}>
        +{step}
      </button>{' '}
      <button type="button" onClick={reset}>
        Reset {label}
      </button>
    </p>
  )
}

export default function CounterDemo() {
  return (
    <main>
      <Counter label="Ones" step={1} />
      <Counter label="Tens" step={10} />
    </main>
  )
}
