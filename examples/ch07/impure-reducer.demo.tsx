import { useReducer } from 'react'

// Two broken reducers. Open this demo, click both buttons, and compare with what you expect.

interface ListState {
  items: string[]
}

// BUG 1: pushes into the existing array. StrictMode calls reducers twice in
// development, and both calls push into the same array.
function listReducer(state: ListState, action: { type: 'add'; item: string }): ListState {
  state.items.push(action.item)
  return { items: state.items }
}

interface CountState {
  count: number
}

// BUG 2: changes the object and returns the same one. React compares the old and
// new state with Object.is, sees the same object, and skips the re-render.
function countReducer(state: CountState, _action: { type: 'increment' }): CountState {
  state.count++
  return state
}

export default function ImpureReducers() {
  const [list, addItem] = useReducer(listReducer, { items: [] })
  const [counter, increment] = useReducer(countReducer, { count: 0 })

  return (
    <main>
      <button type="button" onClick={() => addItem({ type: 'add', item: `Item ${list.items.length + 1}` })}>
        Add item
      </button>
      <ul>
        {list.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <button type="button" onClick={() => increment({ type: 'increment' })}>
        Count: {counter.count}
      </button>
    </main>
  )
}
