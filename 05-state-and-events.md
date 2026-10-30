# Chapter 5 — State and Events

This chapter makes components respond to the user: event handlers, memory with `useState`, and what React
does when that memory changes (render and commit). Then the rules that trip up most newcomers: state is a
snapshot, updates are batched, and objects and arrays in state are never mutated. In the project the dice
roll: three rolls per turn, click-to-hold dice and a rolls-left counter. [Chapter 6](06-thinking-in-react.md)
adds scoring.

## Responding to events

In vanilla code you find the element and attach a listener:
`rollButton.addEventListener('click', handleClick)`. In React you pass the function as a prop whose name
starts with `on`, right on the element in the JSX:

```tsx
function RollButton() {
  function handleClick() {
    console.log('roll')
  }

  return (
    <button type="button" onClick={handleClick}>
      Roll
    </button>
  )
}
```

`onClick={handleClick}` *passes* the function; React calls it when the user clicks. Inline arrow functions
are common for one-liners:

```tsx
<button type="button" onClick={() => console.log('roll')}>
  Roll
</button>
```

### Pass the function, don't call it

The classic mistake is adding parentheses:

```text
onClick={handleClick()}     wrong: calls handleClick now, during render
onClick={handleClick}       right: passes the function
onClick={() => roll(3)}     right: a new function that calls roll(3) later
```

`handleClick()` runs during render, and its *return value* becomes the click handler. TypeScript catches it:
the call returns `void`, and `onClick` expects a function. For `onClick={onRoll()}` in the `DiceTray` you
build at the end of this chapter:

```console
$ npx tsc -b
src/components/DiceTray.tsx:32:55 - error TS2322: Type 'void' is not assignable to type 'MouseEventHandler<HTMLButtonElement> | undefined'.
```

It's the same mistake as `addEventListener('click', handleClick())`.

To pass an argument, wrap the call in an arrow function: `onClick={() => onToggleHold(die.id)}`.

### Naming: `onSomething` and `handleSomething`

Your own components can take handlers as props too. Two conventions keep the data flow readable:

- A **prop** that receives a handler is `on` + event: `onRoll`, `onToggleHold`, `onScore`.
- A **function** that handles an event is `handle` + event: `handleRoll`, `handleToggleHold`.

Read `<DiceTray onRoll={handleRoll} />` as "when the tray reports a roll, `handleRoll` runs". The child only
reports that a roll was requested; it doesn't know what happens next. Built-in elements understand only
browser events (`onClick`, `onChange`, …), but your components can invent any `onX` name for your domain.

### The event object

React passes your handler an **event object** (a *synthetic event* in React's docs). It wraps the native
event with the interface you know (`type`, `target`, `currentTarget`, `preventDefault()`,
`stopPropagation()`, …); the browser's own event is in `e.nativeEvent`.

Type the parameter with React's event types. The type argument is the element the handler sits on, and it
types `e.currentTarget`:

| Prop | Event type (from `'react'`) | Typical element |
|---|---|---|
| `onClick`, `onDoubleClick`, `onMouseEnter` | `MouseEvent<T>` | `HTMLButtonElement`, `HTMLDivElement` |
| `onKeyDown`, `onKeyUp` | `KeyboardEvent<T>` | `HTMLInputElement`, `HTMLDivElement` |
| `onChange` | `ChangeEvent<T>` | `HTMLInputElement`, `HTMLSelectElement`, `HTMLTextAreaElement` |
| `onSubmit` | `SubmitEvent<T>` | `HTMLFormElement` |
| `onFocus`, `onBlur` | `FocusEvent<T>` | any focusable element |

Gotchas:

- Import the types from `'react'` (`import type { MouseEvent } from 'react'`); this shadows the browser's
  global `MouseEvent` type in that file.
- Older code uses `FormEvent` for forms. React 19's types deprecate it ("FormEvent doesn't actually exist");
  use `SubmitEvent` or `ChangeEvent`.
- In an inline handler, `onClick={(e) => …}`, TypeScript infers `e`. Hover over it to see the type, and
  copy that if you move the handler out.

### Propagation and default actions

Bubbling, `target` versus `currentTarget`, `stopPropagation()` and `preventDefault()` work as in the DOM.
React events bubble through your component tree:

`examples/ch05/events.demo.tsx`
```tsx
import type { MouseEvent, SubmitEvent } from 'react'

interface RollButtonProps {
  // Props that take event handlers are named onSomething.
  onRoll: () => void
}

function RollButton({ onRoll }: RollButtonProps) {
  return (
    <button type="button" onClick={onRoll}>
      Roll
    </button>
  )
}

export default function EventsDemo() {
  // The functions that handle them are named handleSomething.
  function handleRoll() {
    console.log('roll')
  }

  function handleHold(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation() // the toolbar's onClick will not run
    console.log('hold, button text:', e.currentTarget.textContent)
  }

  function handleToolbarClick(e: MouseEvent<HTMLDivElement>) {
    const target = e.target instanceof HTMLElement ? e.target.tagName : '?'
    console.log('toolbar click, target:', target, 'currentTarget:', e.currentTarget.className)
  }

  function handleLinkClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault() // no navigation
    console.log('link click, default prevented:', e.defaultPrevented)
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault() // no page reload
    console.log('submit, native event:', e.nativeEvent.constructor.name)
  }

  return (
    <>
      <h1>Events</h1>
      <div className="toolbar" onClick={handleToolbarClick}>
        <RollButton onRoll={handleRoll} />
        <button type="button" onClick={handleHold}>
          Hold
        </button>
      </div>
      <p>
        <a href="https://react.dev" onClick={handleLinkClick}>
          react.dev
        </a>
      </p>
      <form onSubmit={handleSubmit}>
        <button type="submit">Save</button>
      </form>
    </>
  )
}
```

Open `http://localhost:5173/?demo=ch05/events` in the examples app (`npm run dev` in `examples/`) and the
browser console (F12). Click **Roll**, **Hold**, the link, **Save**, and finally the empty space right of the
two buttons. The console shows:

```text
roll
toolbar click, target: BUTTON currentTarget: toolbar
hold, button text: Hold
link click, default prevented: true
submit, native event: SubmitEvent
toolbar click, target: DIV currentTarget: toolbar
```

**Roll** bubbled to the toolbar; **Hold** called `stopPropagation()`, so the toolbar never heard of it; the
link and form stayed on the page because of `preventDefault()`. What differs from the DOM:

- **No `addEventListener`, no `removeEventListener`.** React listens once, at your app's root element, and
  dispatches each event to the right handlers (*event delegation*). That's why `e.nativeEvent.currentTarget`
  is the root element, not your button. When an element disappears, its handlers go with it.
- **Returning `false` does nothing.** In an `onclick` property it cancels the default action; in React,
  call `e.preventDefault()`.
- **`onScroll` doesn't bubble** in React.
- **Capture phase:** add `Capture` to the name, `onClickCapture`, instead of passing `{ capture: true }`.

Handlers are the place for **side effects** (logging, changing state, server calls). They don't run during
rendering, so they needn't be pure.

## State: a component's memory

A component often has to remember something between renders: dice values, held flags, rolls left. A local
variable won't do:

`examples/ch05/counter.demo.tsx`
```tsx
import { useState } from 'react'

function BrokenCounter() {
  // A plain local variable: reset to 0 every time React calls this function.
  let count = 0

  function handleClick() {
    // oxlint-disable-next-line react/immutability -- broken on purpose, to show the problem
    count = count + 1
    console.log('broken count is now', count)
  }

  return (
    <button type="button" onClick={handleClick}>
      Broken count: {count}
    </button>
  )
}

function Counter() {
  // State: React keeps the value between renders, per component instance.
  const [count, setCount] = useState(0)

  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}

export default function CounterDemo() {
  return (
    <>
      <h1>Counters</h1>
      <p>
        <BrokenCounter />
      </p>
      <p>
        <Counter /> <Counter />
      </p>
    </>
  )
}
```

At `?demo=ch05/counter`, click **Broken count** three times, the first **Count** button twice and the second
once. The page shows:

```text
Counters

Broken count: 0

Count: 2 Count: 1
```

and the console:

```text
broken count is now 1
broken count is now 2
broken count is now 3
```

The broken counter's variable changes, but nothing tells React to render again, so the screen shows 0. A new
render would start from `let count = 0` anyway: a render is a fresh function call. You need memory that
survives renders and a way to say "the data changed, render again". `useState` gives you both.

In vanilla code the broken version works, because you update the DOM yourself after changing the variable:

```ts
let count = 0
button.addEventListener('click', () => {
  count++
  button.textContent = `Count: ${count}` // you copy the change to the DOM
})
```

A React component never touches the DOM, so there is nobody to copy the change. `setCount(count + 1)` does
both halves: it stores the new value, and it asks React to call `Counter` again, which returns the new text.
The linter flags the broken version (without the `oxlint-disable` comment, `npx oxlint ch05` warns
`react(immutability): Cannot reassign variable after render completes`).

### `useState`

```tsx
const [count, setCount] = useState(0)
```

- `useState(0)` declares one piece of state with the initial value `0`.
- It returns a pair, unpacked with array destructuring: the **current value** and a **set function**. Name
  them `something` and `setSomething`.
- `setCount(5)` stores the new value and asks React to render the component again. On that render,
  `useState(0)` returns `5`; the initial value is only used the first time.

State belongs to a **component instance**, not the function: the two `<Counter />` elements above have
separate counts, like two objects of one class. React stores the state next to the instance's position in
the tree, for as long as the component stays on screen ([Chapter 10](10-composition-and-context.md) covers
how React decides two renders show "the same" component).

### Typing state

TypeScript infers the type from the initial value, so most state needs no annotation:

```tsx
const [count, setCount] = useState(0)            // number
const [name, setName] = useState('Ada')          // string
const [dice, setDice] = useState(createDice())   // Die[], from createDice's return type
```

Pass a type argument when the initial value doesn't show every possible value:

```tsx
const [selected, setSelected] = useState<Category | null>(null)  // null now, a Category later
const [names, setNames] = useState<string[]>([])                 // [] alone would be never[]
```

The set function is typed too: `setCount('7')` is a compile error.

### Lazy initial state

The initial value is only used on the first render, but the argument is evaluated on *every* render:

```tsx
const [dice, setDice] = useState(createDice())        // calls createDice() on every render
const [dice, setDice] = useState(() => createDice())  // calls it once
```

Pass a function instead (a *lazy initializer*) and React calls it only on the first render. Use one when the
initial value is costly or must be computed once, such as reading saved data. `useState(createDice)` works
too. So to store a *function* in state, wrap it, `useState(() => myFunction)`, or React will call it.

### The rules of Hooks

Functions whose names start with `use` are **Hooks**. `useState` is the first; more follow, and you'll write
your own in [Chapter 13](13-custom-hooks.md). Two rules:

1. Call them only at the **top level** of a component (or another Hook): not inside `if`, loops, nested
   functions or after an early `return`.
2. Call them only from components and Hooks, not plain functions.

React doesn't know your variable names; it remembers state *by call order*, like an array indexed by call
position. If a condition skips a call on one render, every later Hook reads the wrong slot. The linter
reports an error, here for an early `return` before the second `useState` in the project's `App`:

```text
  × react-hooks(rules-of-hooks): React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render.
```

Put all Hook calls first, then the conditions.

## Render and commit

Every screen update takes three steps. Picture a restaurant: a guest orders (trigger), the kitchen cooks
(render), the waiter serves (commit).

| Step | What happens |
|---|---|
| **1. Trigger** | Something asks for a render: the first `root.render(<App />)`, or a set function call. |
| **2. Render** | React calls your components to find out what the screen should show. On the first render it calls the root component. Later it calls the component whose state changed and, recursively, every component it returns. Then it compares the new elements with the previous ones to work out what changed. |
| **3. Commit** | React applies those changes to the DOM, and only those. On the first render it creates all the DOM nodes. |

After the commit, the browser *paints* the changed pixels.

Consequences:

- **A re-render is a function call.** Local variables start fresh; only state carries over.
- **Rendering doesn't mean changing the DOM.** Same elements, empty commit. When the count goes from 1 to 2,
  React changes one text node and leaves the button alone, so things not in the elements (like the cursor
  in a text box) survive.
- **A state change re-renders the component and everything below it**, not parents or siblings: clicking
  one `<Counter />` doesn't call the other. A child re-renders because its parent rendered, even if its
  props didn't change ([Chapter 16](16-rendering-and-performance.md) shows how to skip that when it matters).
- **Render must stay pure** ([Chapter 4](04-components-and-jsx.md#keep-components-pure)). Setting state
  *during* render loops (render → set state → render → …); React detects it and stops:

  ```tsx
  function Loop() {
    const [count, setCount] = useState(0)
    setCount(count + 1) // during render!
    return <p>{count}</p>
  }
  ```

  ```text
  Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.
  ```

  `onClick={setCount(count + 1)}` does the same: the call runs during render. The linter warns about both
  (`react(set-state-in-render): Cannot call setState during render`).

## State as a snapshot

This surprises people: `score` is not a variable that changes over time. It's a constant for one render:

`examples/ch05/snapshot.demo.tsx`
```tsx
import { useState } from 'react'

export default function SnapshotDemo() {
  const [score, setScore] = useState(0)
  console.log('render with score =', score)

  function handlePlusThree() {
    setScore(score + 1)
    setScore(score + 1)
    setScore(score + 1)
    console.log('+3 handler: score is still', score)
  }

  function handleUpdaterPlusThree() {
    setScore((s) => s + 1)
    setScore((s) => s + 1)
    setScore((s) => s + 1)
  }

  function handleDelayedLog() {
    setScore(score + 10)
    setTimeout(() => {
      console.log('one second later, this handler still sees', score)
    }, 1000)
  }

  return (
    <>
      <h1>Score: {score}</h1>
      <button type="button" onClick={handlePlusThree}>
        +3?
      </button>{' '}
      <button type="button" onClick={handleUpdaterPlusThree}>
        +3 with updaters
      </button>{' '}
      <button type="button" onClick={handleDelayedLog}>
        +10, then log
      </button>
    </>
  )
}
```

At `?demo=ch05/snapshot`, click **+3?**, then **+3 with updaters**, then **+10, then log**, and wait a
second. The heading ends at `Score: 14`, and the console shows:

```text
render with score = 0
render with score = 0
+3 handler: score is still 0
render with score = 1
render with score = 1
render with score = 4
render with score = 4
render with score = 14
render with score = 14
one second later, this handler still sees 4
```

(Every render line appears twice because StrictMode renders each component twice in development; see
[Chapter 4](04-components-and-jsx.md#strictmode).)

Step by step:

- **+3?** adds only 1. In that render `score` is `0`, so the handler calls `setScore(0 + 1)` three times. A
  set call doesn't change `score` in the code already running, so the log right after still says 0.
- **+10, then log** sets 14, but the timer still logs `4`: the handler was created in the render where
  `score` was 4, and a closure captures that render's `const`, not a live variable
  ([Chapter 3](03-javascript-for-react.md)).

Each render gets its own `score`, the way each function call gets its own parameters. Set calls only affect
the *next* render. So a handler's values can't change under it halfway through, even when it runs later, in a
timer or after an `await`. In vanilla code, `count` was one variable that every handler shared.

## Batching and updater functions

### Batching

React doesn't render after each set call. It waits until your event handler finishes, then applies all
queued updates in **one** render (**batching**), like a waiter who takes the whole order before going to the
kitchen. Above, three `setScore` calls in one click caused one render. You never see a half-updated screen,
and separate user actions aren't merged: each click is handled and rendered on its own. Since React 18 this
*automatic batching* also covers set calls in timers, promises and other async code, not only in React's
event handlers.

### Updater functions

To compute the next state from the *pending* state instead of the render's snapshot, pass a function:

```tsx
setScore((s) => s + 1)
```

This is an **updater function**. React queues it and, during the next render, runs the queue in order, each
updater receiving the previous result. For **+3 with updaters**, starting from 1:

| Queued update | `s` | Returns |
|---|---|---|
| `s => s + 1` | 1 | 2 |
| `s => s + 1` | 2 | 3 |
| `s => s + 1` | 3 | 4 |

A plain value in the queue replaces whatever came before. Mixing both, starting from 0:

```tsx
setScore(score + 5)       // score is 0: "replace with 5"
setScore((s) => s + 1)    // "add 1 to whatever it is by then"
```

| Queued update | `s` | Returns |
|---|---|---|
| "replace with 5" | 0 (unused) | 5 |
| `s => s + 1` | 5 | 6 |

The result is 6.

A test checks all three cases. `fireEvent.click` clicks the button like a user would
([Chapter 8](08-testing.md) covers testing in depth):

`examples/ch05/queue.test.tsx`
```tsx
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

function Score() {
  const [score, setScore] = useState(0)

  return (
    <>
      <p>Score: {score}</p>
      <button
        type="button"
        onClick={() => {
          setScore(score + 1)
          setScore(score + 1)
          setScore(score + 1)
        }}
      >
        three values
      </button>
      <button
        type="button"
        onClick={() => {
          setScore((s) => s + 1)
          setScore((s) => s + 1)
          setScore((s) => s + 1)
        }}
      >
        three updaters
      </button>
      <button
        type="button"
        onClick={() => {
          setScore(score + 5)
          setScore((s) => s + 1)
        }}
      >
        value, then updater
      </button>
    </>
  )
}

describe('one click from 0', () => {
  it.each([
    ['three values', 'Score: 1'],
    ['three updaters', 'Score: 3'],
    ['value, then updater', 'Score: 6'],
  ])('%s gives %s', (name, expected) => {
    render(<Score />)
    fireEvent.click(screen.getByRole('button', { name }))
    expect(screen.getByRole('paragraph')).toHaveTextContent(expected)
  })
})
```

```console
$ npx vitest run ch05
…
     ✓ three values gives Score: 1 98ms
     ✓ three updaters gives Score: 3 9ms
     ✓ value, then updater gives Score: 6 8ms
…
      Tests  3 passed (3)
```

Rules for updaters:

- Name the parameter after the state, often its first letter: `setRollsLeft((n) => n - 1)`,
  `setDice((current) => …)`.
- Use an updater when a handler derives the next state from the previous one more than once, or for code
  that must stay correct if moved (into a timer or helper). For one `setCount(count + 1)` in a click handler
  both forms agree.
- **Updaters must be pure.** StrictMode calls each one twice in development to catch impure ones. Roll dice,
  call `Math.random()` or log in the handler, never in an updater, and pass the result in.

## Updating objects and arrays

State can hold any value, including objects and arrays. Treat them as **read-only**: to change one, make a
new one and pass that to the set function.

### Why mutation breaks rendering

`examples/ch05/mutation.demo.tsx`
```tsx
import { useState } from 'react'

export default function MutationDemo() {
  const [values, setValues] = useState([3, 5])
  const [other, setOther] = useState(0)

  function handleMutate() {
    values.push(6) // changes the array React is holding...
    setValues(values) // ...and passes the same array back
    console.log('values is now', values)
  }

  function handleCopy() {
    setValues([...values, 6]) // a new array
  }

  return (
    <>
      <h1>Values: {values.join(', ')}</h1>
      <p>Other state: {other}</p>
      <button type="button" onClick={handleMutate}>
        Push 6 (mutate)
      </button>{' '}
      <button type="button" onClick={handleCopy}>
        Add 6 (copy)
      </button>{' '}
      <button type="button" onClick={() => setOther(other + 1)}>
        Change other state
      </button>
    </>
  )
}
```

At `?demo=ch05/mutation`, click **Push 6 (mutate)** twice. The console says:

```text
values is now [3, 5, 6]
values is now [3, 5, 6, 6]
```

but the heading still shows `Values: 3, 5`. Click **Change other state**: the heading jumps to
`Values: 3, 5, 6, 6`. Reload and use **Add 6 (copy)** instead: every click shows up at once.

A set function compares the new value with the current one using `Object.is`, which for objects means *the
same reference*. `setValues(values)` passes the same array, so React skips the render. The mutation sits
invisible until another state change renders the component, then suddenly appears, far from its cause.

Mutation also:

- changes old renders' snapshots under them: a handler that captured `values` sees the mutated array;
- defeats React skipping work for same-reference props ([Chapter 16](16-rendering-and-performance.md));
- turns "did it change?" from one cheap reference comparison into a deep compare.

### Immutable update patterns

Create new arrays and objects with spread syntax and the non-mutating array methods
([Chapter 3](03-javascript-for-react.md)):

`examples/ch05/updates.ts`
```ts
// Immutable updates: build a new value instead of changing the old one.
interface Die {
  id: number
  value: number
  held: boolean
}

const dice: readonly Die[] = [
  { id: 0, value: 2, held: false },
  { id: 1, value: 5, held: true },
  { id: 2, value: 5, held: false },
]

// Add: spread the old items into a new array.
const added = [...dice, { id: 3, value: 1, held: false }]
// Remove: filter.
const removed = dice.filter((die) => die.id !== 1)
// Change one item: map, and copy the item you change.
const toggled = dice.map((die) => (die.id === 2 ? { ...die, held: !die.held } : die))
// Sort, reverse, splice: use the copying versions.
const sorted = dice.toSorted((a, b) => a.value - b.value)

console.log('added:  ', added.map((die) => die.id))
console.log('removed:', removed.map((die) => die.id))
console.log('toggled:', toggled.map((die) => die.held))
console.log('sorted: ', sorted.map((die) => die.value))
console.log('original unchanged:', dice.map((die) => `${die.id}:${die.value}:${die.held}`))

// Untouched items are shared, not copied (a shallow copy).
console.log('toggled[0] === dice[0]:', toggled[0] === dice[0])
console.log('toggled[2] === dice[2]:', toggled[2] === dice[2])

// Nested objects: copy every level on the path to the change.
const game = { round: 2, player: { name: 'Ada', score: 10 } }
const next = { ...game, player: { ...game.player, score: game.player.score + 5 } }
console.log(next, 'old score:', game.player.score)

// React compares old and new state with Object.is: identity, not contents.
console.log(Object.is(game, game), Object.is(game, { ...game }))
```

```console
$ node ch05/updates.ts
added:   [ 0, 1, 2, 3 ]
removed: [ 0, 2 ]
toggled: [ false, true, true ]
sorted:  [ 2, 5, 5 ]
original unchanged: [ '0:2:false', '1:5:true', '2:5:false' ]
toggled[0] === dice[0]: true
toggled[2] === dice[2]: false
{ round: 2, player: { name: 'Ada', score: 15 } } old score: 10
true false
```

The copies are **shallow**: `toggled[0]` is the very same object as `dice[0]`, because it didn't change.
Only the changed die and the array around it are new, so you don't pay for a deep copy and unchanged items
keep their identity. For nested data, copy every level on the path to the change, as `next` does with
`player`.

| Instead of (mutates) | Use (returns a new value) |
|---|---|
| `arr.push(x)`, `arr.unshift(x)` | `[...arr, x]`, `[x, ...arr]` |
| `arr.splice(i, 1)`, `pop`, `shift` | `arr.filter(…)`, `arr.toSpliced(i, 1)`, `arr.slice(…)` |
| `arr[i] = x` | `arr.map(…)`, `arr.with(i, x)` |
| `arr.sort()`, `arr.reverse()` | `arr.toSorted()`, `arr.toReversed()` |
| `obj.field = x` | `{ ...obj, field: x }` |

TypeScript helps: the project types its arrays as `readonly Die[]`, so `dice.push(…)`, `dice.sort()` and
`dice[0] = …` are compile errors
([TypeScript Crash Course, chapter 2](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/02-basic-types.md#arrays)).
It's shallow: `dice[0].held = true` still compiles, so copy the objects too.

## Controlled inputs (preview)

An `<input>` keeps its own text in the DOM; keeping it in state too gives two copies that can disagree. A
**controlled input** fixes that: pass the state as `value` and update it in `onChange`. The state is the
single source of truth; the input just displays it.

`examples/ch05/controlled.demo.tsx`
```tsx
import { useState, type ChangeEvent } from 'react'

export default function ControlledDemo() {
  const [name, setName] = useState('Ada')

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    // React owns the value: whatever you store is what the input shows.
    setName(e.target.value.toUpperCase())
  }

  return (
    <>
      <h1>Controlled input</h1>
      <label>
        Player name <input value={name} onChange={handleChange} />
      </label>
      <p>
        Hello, {name === '' ? 'stranger' : name}! ({name.length} characters)
      </p>
      <button type="button" onClick={() => setName('')}>
        Clear
      </button>
    </>
  )
}
```

At `?demo=ch05/controlled`, type ` lovelace` after "Ada". Each key press runs `handleChange`, which stores
the upper-cased text, so the input shows what you stored, not what you typed:

```text
Controlled input
Player name ADA LOVELACE

Hello, ADA LOVELACE! (12 characters)
```

**Clear** sets the state to `''` and the input empties: you changed the input without touching the DOM.

- React's `onChange` fires on every edit (for a text box, the browser's `input` event), not only when the
  field loses focus like the DOM `change` event.
- `e.target.value` is the text the user just produced; the input won't show it unless you store it.
- With `value` but no `onChange`, the user can't type, and React warns in the console:

  ```text
  You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.
  ```

- `defaultValue` gives an *uncontrolled* input: React sets the first value, then leaves the DOM in charge.

[Chapter 6](06-thinking-in-react.md) compares controlled and uncontrolled components;
[Chapter 9](09-forms.md) covers forms in depth.

## Building five-dice: roll and hold

The dice become interactive:

- A **Roll** button rolls every die that isn't held. After three rolls it's disabled.
- After the first roll, clicking a die holds it (blue border); clicking again releases it.
- A line of text says what to do and how many rolls are left.

Two pieces of state in `App` hold all this: the five dice (values and held flags) and the rolls left.
Everything else, like "has the player rolled yet?", is computed from them.

### `rules.ts`: the roll limit

Add a constant at the top of `src/game/rules.ts`, below the import:

```ts
/** Rolls allowed per turn. */
export const MAX_ROLLS = 3
```

### `dice.ts`: holding a die

Add `toggleHold` to `src/game/dice.ts`, after `applyRoll`. Like `applyRoll`, it returns a new array: the die
with the given `id` is replaced by a copy with `held` flipped, and the others are reused.

```ts
/** Flip the `held` flag of the die with this `id`. Returns a new array. */
export function toggleHold(dice: readonly Die[], id: number): Die[] {
  return dice.map((die) => (die.id === id ? { ...die, held: !die.held } : die))
}
```

Test it in `src/game/dice.test.ts`. Add `toggleHold` to the import:

```ts
import { applyRoll, createDice, createSeededRng, rollDice, rollDie, toggleHold } from './dice'
```

and add a `describe` block at the end of the file:

```ts
describe('toggleHold', () => {
  it('flips only the chosen die', () => {
    const once = toggleHold(createDice(), 2)
    expect(once.map((die) => die.held)).toEqual([false, false, true, false, false])
    const twice = toggleHold(once, 2)
    expect(twice.every((die) => !die.held)).toBe(true)
  })
})
```

### `Die`: a real button

A clickable die should be a `<button>`: focusable, keyboard-operable and announced by screen readers for
free, which a `<div onClick>` is not.

Replace `DieProps` and `Die` in `src/components/Die.tsx` (`PIP_CELLS` stays):

```tsx
interface DieProps {
  value: DieValue
  held: boolean
  disabled: boolean
  onToggle: () => void
}

export function Die({ value, held, disabled, onToggle }: DieProps) {
  return (
    // A real <button>: clickable, focusable and keyboard-operable for free.
    // aria-label and aria-pressed tell screen readers what the pips show
    // and whether the die is held (Chapter 15 covers ARIA).
    <button
      type="button"
      className={held ? 'die die--held' : 'die'}
      disabled={disabled}
      aria-label={`Die showing ${value}`}
      aria-pressed={held}
      onClick={onToggle}
    >
      {PIP_CELLS[value].map((cell) => (
        <span
          key={cell}
          className="pip"
          style={{ gridRow: Math.floor(cell / 3) + 1, gridColumn: (cell % 3) + 1 }}
        />
      ))}
    </button>
  )
}
```

- `type="button"` (not the default `submit`) and `disabled` work as in HTML; `disabled={…}` takes a
  boolean. Holding makes no sense before the first roll.
- `aria-label` names the button ("Die showing 5"), because pips are not text. `aria-pressed` makes it a
  *toggle button* that screen readers announce as pressed or not. Tests in [Chapter 8](08-testing.md) find
  dice by this name.
- The die doesn't hold itself: it reports the click through `onToggle`, and its owner decides.

### `DiceTray`: the Roll button

`DiceTray` gets the rolls left and two callbacks. Replace `src/components/DiceTray.tsx`:

```tsx
import { MAX_ROLLS } from '../game/rules'
import type { Die as DieModel } from '../game/types'
import { Die } from './Die'

interface DiceTrayProps {
  dice: readonly DieModel[]
  rollsLeft: number
  onRoll: () => void
  onToggleHold: (id: number) => void
}

export function DiceTray({ dice, rollsLeft, onRoll, onToggleHold }: DiceTrayProps) {
  // Derived values: computed from props on every render, never stored.
  const hasRolled = rollsLeft < MAX_ROLLS

  return (
    <div className="dice-area">
      <div className="dice-tray">
        {dice.map((die) => (
          <Die
            key={die.id}
            value={die.value}
            held={die.held}
            // You can only hold dice after the first roll of a turn.
            disabled={!hasRolled}
            onToggle={() => onToggleHold(die.id)}
          />
        ))}
      </div>

      <div className="roll-row">
        <button type="button" className="roll-button" onClick={onRoll} disabled={rollsLeft === 0}>
          Roll
        </button>
        <p>
          {hasRolled ? 'Click a die to hold it. ' : 'Roll to start your turn. '}
          Rolls left: {rollsLeft}
        </p>
      </div>
    </div>
  )
}
```

- `hasRolled` is **derived** from `rollsLeft`, so it isn't state. [Chapter 6](06-thinking-in-react.md) makes
  this a rule.
- `onToggle={() => onToggleHold(die.id)}` makes a small function per die that remembers its die: `Die` calls
  it with no arguments, and the tray adds the id.
- `disabled={rollsLeft === 0}` greys out the button when the turn's rolls are used up.

### `App`: the state

`App` owns the state and the handlers. Replace `src/App.tsx`:

```tsx
import { useState } from 'react'
import { DiceTray } from './components/DiceTray'
import { Panel } from './components/Panel'
import { Scorecard } from './components/Scorecard'
import { applyRoll, createDice, rollDice, toggleHold } from './game/dice'
import { MAX_ROLLS } from './game/rules'

function App() {
  // Pass a function to useState so createDice() runs only on the first render.
  const [dice, setDice] = useState(() => createDice())
  const [rollsLeft, setRollsLeft] = useState(MAX_ROLLS)

  function handleRoll() {
    // Randomness belongs in event handlers, never inside an updater function:
    // React may call updaters twice (Strict Mode) and they must be pure.
    const values = rollDice()
    setDice((current) => applyRoll(current, values))
    setRollsLeft((n) => n - 1)
  }

  function handleToggleHold(id: number) {
    setDice((current) => toggleHold(current, id))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Five Dice</h1>
      </header>

      <main className="board">
        <Panel title="Dice">
          <DiceTray
            dice={dice}
            rollsLeft={rollsLeft}
            onRoll={handleRoll}
            onToggleHold={handleToggleHold}
          />
        </Panel>

        <Panel title="Scorecard">
          <Scorecard />
        </Panel>
      </main>

      <footer className="app-footer">
        <p>
          Rules: <a href="https://beesboardsma.com/pages/five-dice">Five Dice</a>
        </p>
      </footer>
    </div>
  )
}

export default App
```

- `useState(() => createDice())` is a lazy initializer: `createDice` runs once.
- `useState(MAX_ROLLS)` starts each turn with three rolls; TypeScript infers `number`.
- `handleRoll` rolls the values *first*, in the handler, then queues two updaters. The `setDice` updater is
  pure, so StrictMode calling it twice does no harm; rolling inside it would roll twice in development.
- Both set calls are batched: one click, one render.
- `applyRoll` and `toggleHold` return new arrays; nothing mutates state.

Data flows one way: `App` passes `dice` and `rollsLeft` down as props; `DiceTray` and `Die` report clicks
back up through `onRoll`, `onToggleHold` and `onToggle`. Only `App` changes the state.

Compare the vanilla roller from [Chapter 2](02-from-vanilla-dom-to-react.md):

```ts
function toggleHold(i: number) {
  held[i] = !held[i]
  dieButtons[i].classList.toggle('held', held[i])
  dieButtons[i].setAttribute('aria-pressed', String(held[i]))
}
```

`handleToggleHold` does only the first line's job, computing the next state. The class and `aria-pressed`
follow from the JSX in `Die`, which already says what a held die looks like, so they can't be forgotten.

### Styles

Add these rules to `src/index.css`, the first after the `.dice-tray` rule:

```css
.dice-area {
  display: grid;
  gap: var(--space-3);
}
```

Then replace the `.die--held` rule with this block, which keeps `.die--held` unchanged and adds rules around
it:

```css
.die:not(:disabled) {
  cursor: pointer;
}

.die:disabled {
  opacity: 0.6;
}

.die--held {
  border-color: var(--color-accent);
  background: #dce8fb;
}

.roll-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.roll-button {
  padding: var(--space-2) var(--space-4);
  color: #fff;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
}

.roll-button:disabled {
  background: var(--color-muted);
  cursor: not-allowed;
}
```

The cursor becomes a hand only over dice you can click.

### What mutation would do here

To see why `toggleHold` returns a new array, try this broken `handleToggleHold` (and remove `toggleHold` from
the import so the linter doesn't flag it as unused):

```tsx
function handleToggleHold(id: number) {
  const die = dice.find((d) => d.id === id)!
  die.held = !die.held // mutates the die React is holding
  setDice(dice) // same array: React sees no change
}
```

It compiles. Roll once and click the first and third dice: no blue border. Roll again: the borders appear on
dice 1 and 3, which kept their values. `setDice(dice)` passed the same array, so React skipped the render;
the next roll's new array rendered the mutated flags. Put the original back.

### Checkpoint

Run the dev server and open the page:

```console
$ npm run dev
```

- At first the dice show 1 to 5, faded (disabled), and the text reads "Roll to start your turn. Rolls left:
  3".
- Click **Roll**: random values, clickable dice, and "Click a die to hold it. Rolls left: 2".
- Click a die: a blue border, and it keeps its value on the next roll. Click again to release it.
- After the third roll the Roll button is grey and the text says "Rolls left: 0". The scorecard doesn't react
  yet, so reload to start again; [Chapter 6](06-thinking-in-react.md) adds scoring.
- The dice are buttons: Tab moves between them, Space holds one, and focus stays on the die you held,
  because React kept the same `<button>` node.

Open React DevTools' **Components** tab and select `App`. Under **hooks** it lists two `State` entries: the
dice array and `3`. Click **Roll** and watch both change. Select a `Die` to see the props `App` passed it,
including the `onToggle` function. You can edit state there too: double-click the `3`, type `1`, press
Enter, and the page re-renders with one roll left.

Then run the checks (these are the lines that matter):

```console
$ npm run build
…
✓ 22 modules transformed.
…
$ npm run lint
…
Found 0 warnings and 0 errors.
$ npx vitest run
…
   ✓ toggleHold (1)
     ✓ flips only the chosen die 0ms
…
      Tests  6 passed (6)
```

The build has 22 modules, one more than before: `App` now imports `dice.ts`, which the page didn't use
until now. The new test is the sixth.

The complete project at this point is in `project/ch05/`.

## Summary

- Pass a function (`onClick={handleClick}`), not a call; use an arrow function to pass arguments. Name
  handler props `onX` and handlers `handleX`: children report events, the state's owner decides.
- Type event objects with `MouseEvent<T>`, `ChangeEvent<T>`, `SubmitEvent<T>`, … from `'react'`.
  Bubbling, `stopPropagation()` and `preventDefault()` work as in the DOM; React delegates from the root,
  so there's no `addEventListener` and returning `false` does nothing.
- `const [value, setValue] = useState(initial)` gives each instance memory across renders. A function gives a
  lazy initial value. Hooks go at the top level only.
- A set call triggers **render** (React calls your components and diffs the result against the last one) and
  **commit** (React patches the DOM where the output differs). A parent's render re-renders its children.
- **State is a snapshot**, constant within a render. React **batches** one event's set calls into one
  render; pure **updater functions** (`setN(n => n + 1)`) compute from the pending state.
- Never mutate state (React compares with `Object.is`); pass new arrays and objects.
- A **controlled input** takes `value` from state and writes back in `onChange`.

## Exercises

1. **Predict the queue.** `n` is 0. A click runs this handler. What does the screen show after the click,
   and after a second click?

   ```tsx
   function handleClick() {
     setN(n + 5)
     setN((x) => x + 1)
     setN(42)
     setN((x) => x * 2)
   }
   ```

   <details><summary>Solution</summary>

   84 both times.

   | Queued update | `x` | Returns |
   |---|---|---|
   | "replace with 5" (`n` is 0) | 0 (unused) | 5 |
   | `x => x + 1` | 5 | 6 |
   | "replace with 42" | 6 (unused) | 42 |
   | `x => x * 2` | 42 | 84 |

   On the second click `n` is 84, so the first update is "replace with 89", but `setN(42)` throws that away
   again: 42 × 2 = 84. Only the updates after the last plain value matter.

   </details>

2. **Release all.** Add a **Release all** button next to Roll that releases every held die, disabled when no
   die is held. Don't add new state.

   <details><summary>Solution</summary>

   In `App.tsx`, add a handler after `handleToggleHold` and pass it to the tray:

   ```tsx
   function handleReleaseAll() {
     setDice((current) => current.map((die) => (die.held ? { ...die, held: false } : die)))
   }
   ```

   ```tsx
   <DiceTray
     dice={dice}
     rollsLeft={rollsLeft}
     onRoll={handleRoll}
     onToggleHold={handleToggleHold}
     onReleaseAll={handleReleaseAll}
   />
   ```

   In `DiceTray.tsx`, add the prop to the interface (`onReleaseAll: () => void`) and the destructuring,
   derive `anyHeld`, and render the button after Roll:

   ```tsx
   const anyHeld = dice.some((die) => die.held)
   ```

   ```tsx
   <button type="button" onClick={onReleaseAll} disabled={!anyHeld}>
     Release all
   </button>
   ```

   `anyHeld` is derived from `dice`, so it can never disagree with them. Unchanged dice are reused
   (`die.held ? … : die`), as in `toggleHold`.

   </details>

3. **Nothing to roll.** With all five dice held, rolling changes nothing but still costs a roll. Disable the
   Roll button in that case.

   <details><summary>Solution</summary>

   In `DiceTray`, derive one more value and use it:

   ```tsx
   const allHeld = dice.every((die) => die.held)
   ```

   ```tsx
   <button type="button" className="roll-button" onClick={onRoll} disabled={rollsLeft === 0 || allHeld}>
   ```

   Hold all five dice after a roll and the button greys out; release one and it comes back. No new state:
   storing `allHeld` would mean syncing it with `dice` by hand in every handler.

   </details>

4. **A name for the player.** Add a text box labelled "Name" in the header, starting with "Player 1". Show
   the name in the dice panel's title as "Player 1's dice"; when the box is empty (or only spaces), the title
   is just "Dice".

   <details><summary>Solution</summary>

   In `App`, add a third piece of state after the other two:

   ```tsx
   const [playerName, setPlayerName] = useState('Player 1')
   ```

   Make the header a controlled input:

   ```tsx
   <header className="app-header">
     <h1>Five Dice</h1>
     <label>
       Name{' '}
       <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
     </label>
   </header>
   ```

   And derive the title:

   ```tsx
   <Panel title={playerName.trim() === '' ? 'Dice' : `${playerName.trim()}'s dice`}>
   ```

   Type "Ada" and the panel says "Ada's dice" on every key press. The inline handler needs no type: `e` is
   inferred from `onChange`. Wrapping the input in its `<label>` connects them, so clicking "Name" focuses
   the box.

   </details>

5. **Spot the bug.** A teammate adds a **Sort** button that orders the dice by value:

   ```tsx
   function handleSort() {
     dice.sort((a, b) => a.value - b.value)
     setDice(dice)
   }
   ```

   After a roll showing 1 3 5 4 3, they click **Sort** and nothing happens. Then they click the last die (a 3)
   to hold it, and suddenly the dice read 1 3 3 4 5 with the *middle* die held. Explain and fix it.

   <details><summary>Solution</summary>

   `sort` sorts **in place**: it mutates the state array and returns the same array. `setDice(dice)` passes
   the same reference, `Object.is` sees no change, and React skips the render.

   The click on the last die runs `toggleHold(current, 4)`. `current` is the already-sorted array, and
   `toggleHold` returns a *new* array, so React renders and you see the sorted order for the first time. Die
   `id` 4 (the 3 you clicked) is now in the middle, so the blue border appears there.

   Fix it with the copying version, and an updater since the new state comes from the old:

   ```tsx
   function handleSort() {
     setDice((current) => current.toSorted((a, b) => a.value - b.value))
   }
   ```

   Typing state as `readonly Die[]` would have caught it: `sort` doesn't exist on a readonly array.

   </details>

Sources for this chapter: [REFERENCES.md](REFERENCES.md#chapter-5--state-and-events)
