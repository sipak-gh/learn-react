import { useContext, useReducer, type ReactNode } from 'react'
import { CountContext, CountDispatchContext, countReducer } from './counter-contexts'

/** Owns the state; shares the value and the dispatch function in two contexts. */
export function CounterProvider({ children }: { children: ReactNode }) {
  const [count, dispatch] = useReducer(countReducer, 0)
  return (
    <CountContext value={count}>
      <CountDispatchContext value={dispatch}>{children}</CountDispatchContext>
    </CountContext>
  )
}

export function Display() {
  const count = useContext(CountContext)
  if (count === null) throw new Error('Display must be used inside <CounterProvider>')
  return <p>Count: {count}</p>
}

export function Buttons() {
  const dispatch = useContext(CountDispatchContext)
  if (!dispatch) throw new Error('Buttons must be used inside <CounterProvider>')
  return (
    <p>
      <button type="button" onClick={() => dispatch({ type: 'add', amount: 1 })}>
        +1
      </button>
      <button type="button" onClick={() => dispatch({ type: 'reset' })}>
        Reset
      </button>
    </p>
  )
}

export default function CounterStoreDemo() {
  return (
    <CounterProvider>
      <Display />
      <section>
        <h2>Controls</h2>
        <Buttons />
      </section>
    </CounterProvider>
  )
}
