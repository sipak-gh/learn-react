import { useReducer } from 'react'

interface CounterState {
  count: number
  /** Earlier counts, newest last, for "Undo". */
  history: number[]
}

type CounterAction = { type: 'add'; amount: number } | { type: 'undo' } | { type: 'reset' }

// The reducer: (state, action) => next state. It lives outside the component
// and knows nothing about React.
function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'add':
      return { count: state.count + action.amount, history: [...state.history, state.count] }
    case 'undo':
      if (state.history.length === 0) return state
      return { count: state.history[state.history.length - 1], history: state.history.slice(0, -1) }
    case 'reset':
      return { count: 0, history: [] }
  }
}

export default function Counter() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0, history: [] })

  // The event handlers only say WHAT happened. The reducer decides what it means.
  return (
    <main>
      <h1>Count: {state.count}</h1>
      <button type="button" onClick={() => dispatch({ type: 'add', amount: 1 })}>
        +1
      </button>
      <button type="button" onClick={() => dispatch({ type: 'add', amount: 5 })}>
        +5
      </button>
      <button type="button" onClick={() => dispatch({ type: 'undo' })} disabled={state.history.length === 0}>
        Undo
      </button>
      <button type="button" onClick={() => dispatch({ type: 'reset' })}>
        Reset
      </button>
    </main>
  )
}
