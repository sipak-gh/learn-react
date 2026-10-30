# Chapter 16 — Rendering and Performance

This chapter covers when React calls your components, why that's usually cheap, and what to do when it
isn't: how React decides a value is "the same", the manual memoization tools (`memo`, `useMemo`,
`useCallback`), `useDeferredValue` for keeping typing fast, measuring with `<Profiler>` and React DevTools,
and the **React Compiler**, which memoizes for you at build time. In the project you measure Five Dice, turn on the compiler, and measure again.
[Chapter 15](15-accessibility.md) finished the accessibility pass; [Chapter 17](17-async-react.md) adds async
data.

## When a component renders

From [Chapter 5](05-state-and-events.md): a **render** is React calling your component to get JSX. The
**commit** follows: React compares the new JSX with the last and changes the DOM only where they differ.

A component renders for one of three reasons:

| Trigger | Example |
|---|---|
| Its own state changed | `setCount(count + 1)` |
| Its parent rendered | the parent's state changed, so it returns new JSX for its children |
| A context it reads changed | `useContext(ScoreContext)` and the provider got a new `value` |

The second row surprises people: props needn't change. When a parent renders, React renders the whole
subtree it returned.

This test records each component's name when React calls it. Each `it` checks one rule.

`examples/ch16/render-triggers.test.tsx`

```tsx
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { beforeEach, expect, it } from 'vitest'

// Each component writes its name here when React calls it. Writing to an
// outside variable during render is impure: fine for a test, never in an app.
let renders: string[] = []
beforeEach(() => {
  renders = []
})

function Child() {
  renders.push('Child')
  return <p>I have no props</p>
}

function Counter() {
  renders.push('Counter')
  const [count, setCount] = useState(0)
  return (
    <>
      <button type="button" onClick={() => setCount(count + 1)}>
        Add one
      </button>
      <button type="button" onClick={() => setCount(count)}>
        Set the same
      </button>
      <output>{count}</output>
      <Child />
    </>
  )
}

it('renders the component whose state changed, and everything inside it', async () => {
  const user = userEvent.setup()
  render(<Counter />)
  expect(renders).toEqual(['Counter', 'Child'])

  renders = []
  await user.click(screen.getByRole('button', { name: 'Add one' }))
  // Child has no props at all, yet it renders again: its parent did.
  expect(renders).toEqual(['Counter', 'Child'])
})

it('skips the render when the new state is the same value (Object.is)', async () => {
  const user = userEvent.setup()
  render(<Counter />)

  renders = []
  await user.click(screen.getByRole('button', { name: 'Set the same' }))
  expect(renders).toEqual([])
})

function Toggle({ children }: { children: ReactNode }) {
  renders.push('Toggle')
  const [on, setOn] = useState(false)
  return (
    <section>
      <button type="button" onClick={() => setOn(!on)}>
        {on ? 'On' : 'Off'}
      </button>
      {children}
    </section>
  )
}

it('does not render children that were passed in from above', async () => {
  const user = userEvent.setup()
  render(
    <Toggle>
      <Child />
    </Toggle>,
  )

  renders = []
  await user.click(screen.getByRole('button', { name: 'Off' }))
  // <Child /> was created by the test, not by Toggle: same element, no render.
  expect(renders).toEqual(['Toggle'])
})

const ScoreContext = createContext(0)

function Middle() {
  renders.push('Middle')
  return <Reader />
}

function Reader() {
  renders.push('Reader')
  return <p>Score: {useContext(ScoreContext)}</p>
}

it('renders every component that reads a context when its value changes', () => {
  const middle = <Middle />
  const { rerender } = render(<ScoreContext value={1}>{middle}</ScoreContext>)

  renders = []
  rerender(<ScoreContext value={2}>{middle}</ScoreContext>)
  // Middle is the same element, so it is skipped, but Reader reads the context.
  expect(renders).toEqual(['Reader'])
  expect(screen.getByText('Score: 2')).toBeInTheDocument()
})

it('changes only what differs in the DOM', async () => {
  const user = userEvent.setup()
  render(<Counter />)
  await user.click(screen.getByRole('button', { name: 'Add one' }))

  const changes: MutationRecord[] = []
  const observer = new MutationObserver((records) => changes.push(...records))
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true })

  renders = []
  await user.click(screen.getByRole('button', { name: 'Add one' }))
  await act(async () => {}) // let the observer report
  expect(renders).toEqual(['Counter', 'Child'])
  // Two components rendered, but only the number changed in the page.
  expect(changes.map((change) => `${change.type}: ${change.target.textContent}`)).toEqual(['characterData: 2'])
  observer.disconnect()
})
```

Run it from `examples/` (`--reporter=verbose` prints each test's name):

```console
$ npx vitest run ch16/render-triggers.test.tsx --reporter=verbose

 RUN  v5.0.5 /home/you/learn-react/examples

 ✓ ch16/render-triggers.test.tsx > renders the component whose state changed, and everything inside it 118ms
 ✓ ch16/render-triggers.test.tsx > skips the render when the new state is the same value (Object.is) 13ms
 ✓ ch16/render-triggers.test.tsx > does not render children that were passed in from above 13ms
 ✓ ch16/render-triggers.test.tsx > renders every component that reads a context when its value changes 5ms
 ✓ ch16/render-triggers.test.tsx > changes only what differs in the DOM 23ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  16:14:00
   Duration  689ms (environment 57%, tests 28%, setup 9%, import 4%, transform 1%, worker 1%)
```

(Timings vary on every run.)

What the tests show:

- **Parent renders, child renders.** `Child` has no props, yet runs on every click.
- **Same state, no render.** `setCount(count)` stores an `Object.is`-equal value, so React skips the render.
  (Rarely React calls the component once before bailing out, but never renders its children or touches the
  DOM.)
- **Children from above are skipped.** The *test* created `<Child />`. `Toggle` returns that same element
  object from `children`, so React skips it. That's a cheap fix for a slow subtree: move the state into a
  small wrapper and pass the slow part in as `children`.
- **Context reaches past skipped components.** `Middle` is skipped, but `Reader` reads the context, so it
  renders.
- **A render is not a DOM update.** Two components rendered, but the `MutationObserver` (a browser API, also
  in jsdom, that reports DOM changes) saw one change: the text node `2`. `act` waits for React and the
  observer to settle.

### Why re-rendering is usually fine

A render calls a function and diffs two small trees of plain objects: microseconds per component. The
expensive part of a browser is the DOM (layout and paint), and React touches it only where output differs.

So "render the whole subtree" trades a little CPU for simple code: you never tell React what changed.
Compare the one-`render()` dice roller from [Chapter 2](02-from-vanilla-dom-to-react.md#one-render-function-and-why-it-isnt-enough):

| | Vanilla `render()` | React render |
|---|---|---|
| What runs on every change | your code builds new `<button>` elements | your component builds plain JSX objects |
| What reaches the DOM | `replaceChildren(...)`: every die replaced | only the attributes and text that differ |
| Focus, selection, typed text | lost: the focused button left the page | kept: the same DOM nodes stay |

Re-rendering becomes a problem when:

- a component does **expensive work in its body** (big loops, sorting thousands of items, parsing);
- a **huge subtree** renders on every keystroke (hundreds of rows, a chart with thousands of points);
- an Effect depends on a value that is **new on every render**, so it runs every time
  ([Chapter 11](11-effects.md)).

Only the third is a correctness bug. The first two are speed problems: measure before fixing.

## Identity: when is a value "the same"?

React compares state, props and dependency arrays with
[`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
For primitives that means "same value". For objects, arrays and functions it means "the same object", which
is what `===` checks for them ([Chapter 3](03-javascript-for-react.md#immutability-and-reference-equality)).

`examples/ch16/identity.ts`

```ts
// React compares props, state and dependencies with Object.is: "the same value?"
console.log(Object.is(3, 3)) // numbers, strings, booleans: compared by value
console.log(Object.is('Ada', 'Ada'))
console.log(Object.is([3, 4], [3, 4])) // two arrays: two different objects
console.log(Object.is({ held: true }, { held: true }))

// A component body runs again on every render, so it makes new objects each time.
function render() {
  const dice = [3, 4, 5]
  const onRoll = () => console.log('roll')
  return { dice, onRoll }
}
const first = render()
const second = render()
console.log(Object.is(first.dice, second.dice), Object.is(first.onRoll, second.onRoll))

// Keep a reference and it stays the same.
const kept = first.dice
console.log(Object.is(kept, first.dice))
```
```console
$ node ch16/identity.ts
true
true
false
false
false false
true
```

So every `{…}`, `[…]` and `() => …` in a component body is new on every render. That only matters where
something *compares* it: `memo`, a dependency array, or a context `value`.

Components have identity too: React keeps a component's state while the same type stays at the same
**position in the tree**, and a new `key` resets it ([Chapter 10](10-composition-and-context.md)).

## `memo`: skip a component when its props are equal

`memo(Component)` returns a component that remembers its last props. If every new prop is `Object.is`-equal
to the old one, React skips the render and reuses the last output.

```tsx
import { memo } from 'react'

const Die = memo(function Die({ index, held, onToggle }: DieProps) {
  // ...
})
```

`memo` only looks at props. The component still renders when its own state or a context it reads changes.

The trap is identity: a new function or array is a changed prop every time. Two hooks give you stable
values:

| Hook | Caches | Same value until… |
|---|---|---|
| `useMemo(() => compute(a, b), [a, b])` | the *result* of a function | `a` or `b` changes |
| `useCallback(fn, [a, b])` | the *function* itself | `a` or `b` changes |

`useCallback(fn, deps)` equals `useMemo(() => fn, deps)`. Dependencies are compared with `Object.is`, as in
`useEffect`.

The test renders two memoized dice, first with an inline `onToggle`, then with a cached one:

`examples/ch16/memo.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { memo, useCallback, useMemo, useState } from 'react'
import { beforeEach, expect, it } from 'vitest'

let renders: string[] = []
beforeEach(() => {
  renders = []
})

interface DieProps {
  index: number
  held: boolean
  onToggle: (index: number) => void
}

// memo() returns a component that skips rendering when every prop is
// Object.is-equal to the one it got last time.
const Die = memo(function Die({ index, held, onToggle }: DieProps) {
  renders.push(`Die ${index + 1}`)
  return (
    <button type="button" aria-pressed={held} onClick={() => onToggle(index)}>
      Die {index + 1}
    </button>
  )
})

const flip = (held: boolean[], index: number) => held.map((h, i) => (i === index ? !h : h))

function Tray({ stable }: { stable: boolean }) {
  const [held, setHeld] = useState([false, false])
  const [rolls, setRolls] = useState(0)

  // A new function on every render...
  const inline = (index: number) => setHeld((current) => flip(current, index))
  // ...or the same function every time (setHeld never changes).
  const cached = useCallback((index: number) => setHeld((current) => flip(current, index)), [])
  const onToggle = stable ? cached : inline

  return (
    <>
      <button type="button" onClick={() => setRolls(rolls + 1)}>
        Rolls: {rolls}
      </button>
      {held.map((h, i) => (
        <Die key={i} index={i} held={h} onToggle={onToggle} />
      ))}
    </>
  )
}

it('does nothing when a prop is a new function every render', async () => {
  const user = userEvent.setup()
  render(<Tray stable={false} />)

  renders = []
  await user.click(screen.getByRole('button', { name: 'Rolls: 0' }))
  expect(renders).toEqual(['Die 1', 'Die 2'])
})

it('skips the render when every prop is the same value', async () => {
  const user = userEvent.setup()
  render(<Tray stable={true} />)

  renders = []
  await user.click(screen.getByRole('button', { name: 'Rolls: 0' }))
  expect(renders).toEqual([])

  await user.click(screen.getByRole('button', { name: 'Die 1' }))
  expect(renders).toEqual(['Die 1']) // only the die whose `held` changed
})

const Total = memo(function Total({ dice }: { dice: number[] }) {
  renders.push('Total')
  return <output>{dice.reduce((sum, die) => sum + die, 0)}</output>
})

function Board({ cacheArray }: { cacheArray: boolean }) {
  const [tick, setTick] = useState(0)
  const fresh = [3, 4, 5]
  const cached = useMemo(() => [3, 4, 5], [])
  return (
    <>
      <button type="button" onClick={() => setTick(tick + 1)}>
        Tick {tick}
      </button>
      <Total dice={cacheArray ? cached : fresh} />
    </>
  )
}

it('treats a new array with the same contents as a changed prop', async () => {
  const user = userEvent.setup()
  const { unmount } = render(<Board cacheArray={false} />)
  renders = []
  await user.click(screen.getByRole('button', { name: 'Tick 0' }))
  expect(renders).toEqual(['Total'])
  unmount()

  render(<Board cacheArray={true} />)
  renders = []
  await user.click(screen.getByRole('button', { name: 'Tick 0' }))
  expect(renders).toEqual([])
})
```
```console
$ npx vitest run ch16/memo.test.tsx --reporter=verbose

 RUN  v5.0.5 /home/you/learn-react/examples

 ✓ ch16/memo.test.tsx > does nothing when a prop is a new function every render 141ms
 ✓ ch16/memo.test.tsx > skips the render when every prop is the same value 29ms
 ✓ ch16/memo.test.tsx > treats a new array with the same contents as a changed prop 25ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  16:14:38
   Duration  898ms (environment 57%, tests 25%, setup 9%, transform 4%, import 4%, worker 1%)
```

Notes:

- `cached` has no dependencies: it uses only `setHeld` (setters never change) and the module-level `flip`.
  The updater form `setHeld((current) => …)` makes that possible, since it doesn't read `held`.
- `memo` needs *all* props stable. One inline `onClick={() => …}` or `style={{ … }}` undoes it.
- Caches cost memory, a comparison per render, and readability. Add them where a measurement says so.

### Gotcha: a missing dependency

Leave a value the callback reads out of the dependency list, and the cache never refreshes: a stale result.
The linter catches it. Here `bonus` is missing:

```tsx
export function Total({ dice, bonus }: { dice: number[]; bonus: number }) {
  const total = useMemo(() => dice.reduce((sum, die) => sum + die, 0) + bonus, [dice])
  return <p>{total}</p>
}
```
```console
$ npx oxlint

  ! react-hooks(exhaustive-deps): React Hook useMemo has a missing dependency: 'bonus'
   ,-[src/Bad.tsx:4:80]
 3 | export function Total({ dice, bonus }: { dice: number[]; bonus: number }) {
 4 |   const total = useMemo(() => dice.reduce((sum, die) => sum + die, 0) + bonus, [dice])
   :                                                                         ^^|^^  ^^^^^^
   :                                                                           `-- useMemo uses `bonus` here
 5 |   return <p>{total}</p>
   `----
  help: Either include it or remove the dependency array.
```

The dependency list is a list of inputs, not a knob. To change the value less often, change the inputs.

### `useMemo` for expensive work

`useMemo` also skips **slow calculations**, with or without `memo`. This demo counts every roll of eight dice
(6⁸ = 1,679,616) to find the most likely total. Typing a name re-renders the component; the checkbox turns
caching on.

`examples/ch16/dice-odds.demo.tsx`

```tsx
import { Profiler, useMemo, useState, type ProfilerOnRenderCallback } from 'react'

// Visit every possible roll of `count` dice (6^count of them) and count how
// often each total comes up. 8 dice = 1,679,616 rolls: slow on purpose.
function sumOdds(count: number): Map<number, number> {
  const totals = new Map<number, number>()
  const dice = Array<number>(count).fill(1)
  for (;;) {
    const total = dice.reduce((sum, die) => sum + die, 0)
    totals.set(total, (totals.get(total) ?? 0) + 1)
    let i = 0
    while (i < count && dice[i] === 6) dice[i++] = 1
    if (i === count) return totals
    dice[i] += 1
  }
}

function Odds({ count, cached }: { count: number; cached: boolean }) {
  const memoized = useMemo(() => (cached ? sumOdds(count) : null), [cached, count])
  const totals = memoized ?? sumOdds(count)
  const rolls = 6 ** count
  const best = [...totals].reduce((a, b) => (b[1] > a[1] ? b : a))
  return (
    <p>
      {rolls.toLocaleString('en-US')} possible rolls. The most likely total is {best[0]} (
      {((best[1] / rolls) * 100).toFixed(1)}%).
    </p>
  )
}

const logRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
  console.log(`${id} ${phase}: ${actualDuration.toFixed(1)} ms`)
}

export default function DiceOddsDemo() {
  const [count, setCount] = useState(8)
  const [name, setName] = useState('')
  const [cached, setCached] = useState(false)

  return (
    <main>
      <label>
        Dice: <input type="number" min={1} max={8} value={count} onChange={(e) => setCount(e.target.valueAsNumber || 1)} />
      </label>{' '}
      <label>
        <input type="checkbox" checked={cached} onChange={(e) => setCached(e.target.checked)} /> useMemo
      </label>
      <p>
        <label>
          Player name: <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>{' '}
        Hello, {name || 'stranger'}!
      </p>
      <Profiler id="Odds" onRender={logRender}>
        <Odds count={count} cached={cached} />
      </Profiler>
    </main>
  )
}
```

Run `npm run dev` in `examples/` and open `http://localhost:5173/?demo=ch16/dice-odds`. The page shows
"1,679,616 possible rolls. The most likely total is 28 (8.1%)." Open the console (F12), type `Ada` in the
name field, tick **useMemo**, clear the name, type `Bo`, then set **Dice** to 3:

```text
Odds mount: 54.4 ms
Odds update: 41.1 ms        ← typing "A": sumOdds runs again
Odds update: 41.6 ms        ← "d"
Odds update: 40.9 ms        ← "a"
Odds update: 43.2 ms        ← ticking useMemo: computes once and caches
Odds update: 0.1 ms         ← clearing the name: cached
Odds update: 0.2 ms         ← "B"
Odds update: 0.2 ms         ← "o"
Odds update: 0.1 ms         ← 3 dice: 216 rolls, cheap anyway
```

(Your numbers will differ. The arrows are annotations, not output.)

40 ms per keystroke makes typing feel sticky; a 60 Hz screen draws a frame every 16.7 ms. With the cache,
`Odds` still renders but skips the work.

- `useMemo` is a hint, not a guarantee. React may drop the cache (for example, in development when you edit
  the file), so your code must stay correct if the function runs again.
- Moving state down often beats `useMemo`. If the name field kept its state in its own small component,
  typing wouldn't render `Odds` at all (Exercise 1).

## `useDeferredValue`: keep typing fast while a slow part catches up

`useMemo` helps when the slow work has the same inputs as last time. When the input really changed, such as
a search box above a long list, the work has to happen. `useDeferredValue` lets it happen **later**, so it
doesn't block typing.

`useDeferredValue(value)` returns a copy of `value` that may lag behind. On each change React renders twice:

1. An urgent render with the **old** deferred value. Components that depend only on it are skipped (with
   `memo`), so this render is fast and the input updates at once.
2. A background render with the new value. If the value changes again first, React drops this render and
   starts over.

`examples/ch16/deferred.demo.tsx`

```tsx
import { memo, useDeferredValue, useState } from 'react'

/** Stands in for expensive rendering work: just waits `ms` milliseconds. */
function busyWait(ms: number) {
  const end = performance.now() + ms
  while (performance.now() < end) {}
}

function SlowItem({ text, index }: { text: string; index: number }) {
  busyWait(1)
  return (
    <li>
      {text} #{index + 1}
    </li>
  )
}

// memo matters: during the urgent render, SlowList gets the old text and is skipped.
const SlowList = memo(function SlowList({ text }: { text: string }) {
  console.log(`SlowList "${text}"`)
  return (
    <ul>
      {Array.from({ length: 200 }, (_, index) => (
        <SlowItem key={index} text={text} index={index} />
      ))}
    </ul>
  )
})

export default function DeferredDemo() {
  const [text, setText] = useState('')
  const [defer, setDefer] = useState(true)
  const deferredText = useDeferredValue(text)
  const listText = defer ? deferredText : text

  return (
    <main>
      <label>
        Search: <input value={text} onChange={(e) => setText(e.target.value)} />
      </label>{' '}
      <label>
        <input type="checkbox" checked={defer} onChange={(e) => setDefer(e.target.checked)} /> useDeferredValue
      </label>
      {/* Dim the list while it shows an older value. */}
      <div style={{ opacity: listText === text ? 1 : 0.5 }}>
        <SlowList text={listText} />
      </div>
    </main>
  )
}
```

`SlowList` takes about 200 ms to render. `memo` matters: in the urgent render, `SlowList` gets its old
`text` and is skipped (Exercise 5 removes it).

Open `?demo=ch16/deferred` and type quickly. With the box ticked, letters appear as you type, and the list
dims, then catches up. Unticked, each keystroke waits for the list and the input stutters. In Chrome,
typing "dice" with 30 ms between keys took 176 ms with `useDeferredValue` and 1793 ms without.

In vanilla code you'd debounce: wait until typing pauses, then update the list. `useDeferredValue` has no
fixed delay: on a fast machine the list keeps up at once, and React interrupts a background render when you
type again. It
doesn't make the slow component faster. Five Dice has nothing that slow, so the project doesn't use it.

[Chapter 17](17-async-react.md) calls this kind of interruptible background render a **transition**, and
shows how `useDeferredValue` also keeps old content on screen while new data loads.

## Measure first: `<Profiler>` and React DevTools

Don't guess where time goes. React gives you two tools.

### The `<Profiler>` component

`<Profiler id onRender>` wraps a subtree. After each commit that touched it, React calls `onRender` (type
`ProfilerOnRenderCallback`, from `react`):

| Argument | Meaning |
|---|---|
| `id` | the `id` prop, to tell several profilers apart |
| `phase` | `"mount"` for the first render; `"update"` or `"nested-update"` for re-renders |
| `actualDuration` | ms spent rendering the subtree in *this* commit; it drops when memoization skips work |
| `baseDuration` | estimated ms to render the *whole* subtree with no memoization: the worst case |
| `startTime`, `commitTime` | timestamps of the render and the commit |

Gotchas:

- **Dev timings are inflated.** Dev React runs extra checks, and `<StrictMode>` renders everything twice.
  Use dev numbers only to compare before with after.
- **Production builds turn `<Profiler>` off.** To profile production, alias `react-dom/client` to React's
  *profiling build*, `react-dom/profiling`, in Vite. The project does this below.
- Profiling has a small cost, so remove temporary instrumentation afterwards.

### React DevTools

The React DevTools browser extension (Chrome, Firefox, Edge) adds two tabs to the developer tools:

- **Components:** the tree, with each component's props, state and hooks. Components the React Compiler
  optimized show a **Memo ✨** badge.
- **Profiler:** record, use the app, stop. Each commit gets a bar chart ("flame graph") of which components
  rendered and for how long; grey bars didn't render. The setting **"Highlight updates when components
  render"** flashes a border around each rendering component.

The browser's own **Performance** panel also shows React: in development and profiling builds, React adds
*Scheduler* and *Components* tracks to the timeline, next to network requests and other JavaScript.

DevTools answers "why did this render?" fastest; `<Profiler>` gives numbers you can log, diff and test.

## The React Compiler

Manual memoization is tedious and fragile: one inline function and `memo` stops working. The **React
Compiler** does it for you. It's a build-time Babel plugin (`babel-plugin-react-compiler`, stable since 1.0)
that rewrites each component and hook so that JSX elements and computed values are cached until their inputs
change. An unchanged child element is then *the same object*, so React skips it, like the `children` trick
above. You write plain code; the compiler works out the dependencies.

It needs components that follow the **Rules of React** ([Chapter 4](04-components-and-jsx.md),
[Chapter 13](13-custom-hooks.md)): pure components, no mutated props or state, hooks at the top level, no
refs read during render. If it detects a broken rule, it **skips that component** and leaves it as written.
The app still works; that component just isn't optimized.

Oxlint's React rules include the compiler's checks, so the linter tells you. Reading a ref during render:

```tsx
export function RenderCounter() {
  const renders = useRef(0)
  renders.current += 1
  return <p>Rendered {renders.current} times</p>
}
```
```console
$ npx oxlint

  ! react(refs): Cannot access refs during render
    ,-[src/Bad.tsx:10:3]
  9 |   const renders = useRef(0)
 10 |   renders.current += 1
    :   ^^^^^^^|^^^^^^^
    :          `-- Cannot access ref value during render
 11 |   return <p>Rendered {renders.current} times</p>
    `----
  help: React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected
  note: React Compiler skipped optimizing this component or hook. Additional guidance: https://react.dev/reference/eslint-plugin-react-hooks/lints/refs
```

(Two more warnings follow, for the other two `renders.current` uses.)

Keep in mind:

- **It's a free default, not a bug fix.** Turn it on for new projects. Measure anyway.
- **`useMemo` and `useCallback` remain escape hatches** for precise control, mainly to keep an Effect
  dependency stable. Leave existing ones in place: removing them can change the compiler's output.
- **`"use no memo"`** as a function's first statement skips that function: a temporary debugging tool for
  when you suspect the compiler (Exercise 4).
- **It only compiles components and hooks.** A slow plain function called from two components runs in each.
  Cache it yourself if it's really expensive.
- The examples sandbox has no compiler, so `memo`, `useMemo` and `useCallback` there behave exactly as
  written. The project gets the compiler below.

## Long lists: virtualization

Memoization can't help when you really show 10,000 rows: the first render is slow and the DOM gets heavy. The
fix is **virtualization** (*windowing*): render only the visible rows plus a few, and swap them as the user
scrolls. A tall empty element keeps the scrollbar the right size. Libraries such as TanStack Virtual and
react-window do this. Five Dice shows at most 13 categories and a few players, so it doesn't need it.

## Building Five Dice: measure, then compile

The game feels instant. Before changing anything, find out which components render on each interaction and
how long a commit takes. You add temporary instrumentation, measure in development and in a production
profiling build, enable the compiler, measure again, then remove the instrumentation. Only two files change
for good: `package.json` (three dev dependencies) and `vite.config.ts`.

### Step 1: temporary instrumentation

Create a module that counts renders by name and logs them after every commit.

`src/renderLog.ts` (temporary)

```ts
import type { ProfilerOnRenderCallback } from 'react'

// TEMPORARY (Chapter 16): count renders per component and time each commit.
const counts: Record<string, number> = {}

/** Call at the top of a component: counts one render. */
export function countRender(name: string) {
  counts[name] = (counts[name] ?? 0) + 1
}

/** <Profiler onRender>: React calls it after each commit. */
export const logCommit: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
  console.log(
    `${id} ${phase}: ${actualDuration.toFixed(1)} ms (all: ${baseDuration.toFixed(1)} ms)`,
    JSON.stringify(counts),
  )
  for (const name in counts) delete counts[name]
}
```

`countRender` writes to a module variable during render. That breaks the purity rule on purpose: it's a
measuring probe, gone by the end of this section.

Wrap the app in a `<Profiler>`:

`src/main.tsx` (temporary)

```tsx
import { Profiler, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logCommit } from './renderLog'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Profiler id="App" onRender={logCommit}>
      <App />
    </Profiler>
  </StrictMode>,
)
```

Then make `countRender('<Name>')` the first line of eight components: `App`, `Game`, `Panel`, `DiceTray`,
`Die`, `Scorecard`, `Scoreboard` and `ThemeSelect`. For example, in `src/components/Die.tsx`:

```tsx
import { countRender } from '../renderLog'
// ...the other imports stay

export function Die({ value, held, disabled, onToggle, shortcut, ref }: DieProps) {
  countRender('Die')
  return (
    // ...unchanged
  )
}
```

In `src/App.tsx` the import path is `'./renderLog'`.

### Step 2: measure in development

Run `npm run dev` and open the console. Add a second player, start the game, roll, click the first die to
hold it, roll again, score any category, and switch the theme to Dark. A roll logs:

```text
App update: 5.3 ms (all: 5.8 ms) {"Game":2,"Panel":6,"DiceTray":2,"Die":10,"Scoreboard":2,"Scorecard":2}
```

`<StrictMode>` doubles every count (it calls each component twice in development). Timings vary by machine
and run; on a slow laptop a dev commit can take 15–25 ms.

### Step 3: measure a production profiling build

Dev numbers are inflated, so measure the real thing. In `vite.config.ts`, add a temporary alias below
`plugins: [react()],` so the build uses React's profiling build and `<Profiler>` keeps working:

`vite.config.ts` (temporary)

```ts
  plugins: [react()],
  // TEMPORARY (Chapter 16): React's profiling build, so <Profiler> works in production.
  resolve: { alias: { 'react-dom/client': 'react-dom/profiling' } },
```

Run `npm run build && npm run preview`, open `http://localhost:4173/` and repeat the steps. One line per
interaction:

| Interaction | Console |
|---|---|
| page load | `App mount: 3.3 ms (all: 1.5 ms) {"App":1,"ThemeSelect":1}` |
| start game | `App update: 0.1 ms (all: 1.3 ms) {}` then `App update: 2.2 ms (all: 1.4 ms) {"App":1,"ThemeSelect":1,"Game":1,"Panel":3,"DiceTray":1,"Die":5,"Scoreboard":1,"Scorecard":1}` |
| roll | `App update: 0.9 ms (all: 0.8 ms) {"Game":1,"Panel":3,"DiceTray":1,"Die":5,"Scoreboard":1,"Scorecard":1}` |
| hold die 1 | `App update: 0.4 ms (all: 0.6 ms)`, same counts as roll |
| roll again | `App update: 0.4 ms (all: 0.5 ms)`, same counts |
| score | `App update: 0.4 ms (all: 0.5 ms)`, same counts |
| theme → Dark | `App update: 0.0 ms (all: 0.4 ms) {"ThemeSelect":1}` |

The empty `{}` commit on start comes from `NewGameForm`'s form action, which isn't instrumented.

### Step 4: read the results

- **The whole game re-renders on every move.** `Game`, `DiceTray`, `Scorecard` and `Scoreboard` read the
  game state from context ([Chapter 10](10-composition-and-context.md)), so they must. `Panel` and `Die`
  render because their parents did.
- **Holding one die renders all five `Die`s**, though only one changed.
- **The theme switch is already minimal.** Only `ThemeSelect` owns that state.
- **It doesn't matter.** A whole move costs under 1 ms in production; a frame is 16.7 ms.

Five Dice has no performance problem. But the compiler costs no code, removes the wasted renders, and
protects you as the app grows. So turn it on.

### Step 5: install and configure the React Compiler

The compiler is a Babel plugin, and Vite 8 doesn't use Babel (it transforms TypeScript and JSX with Oxc). So
install Babel plus a small Rolldown plugin that runs it:

```console
$ npm install -D babel-plugin-react-compiler @rolldown/plugin-babel @babel/core

added 54 packages, and audited 173 packages in 2s

29 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

`package.json` gains three dev dependencies:

```json
    "@babel/core": "^8.0.10",
    "@rolldown/plugin-babel": "^0.2.4",
    "babel-plugin-react-compiler": "^1.0.0",
```

`@vitejs/plugin-react` exports `reactCompilerPreset()`, a ready-made Babel preset for the compiler. Add it
to `vite.config.ts` (keep the temporary alias for now):

```ts
/// <reference types="vitest/config" />
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // React Compiler: memoizes components and hooks automatically at build time.
    // It runs as a Babel preset; Vite itself transforms code with Oxc.
    babel({ presets: [reactCompilerPreset()] }),
  ],
  // TEMPORARY (Chapter 16): React's profiling build, so <Profiler> works in production.
  resolve: { alias: { 'react-dom/client': 'react-dom/profiling' } },
  // Vitest reads its settings from the same file: https://vitest.dev/config/
  test: {
    // ...unchanged
  },
})
```

The compiler must be the first Babel plugin to run, so it sees your original code. Here it's the only one.

### Step 6: measure again

Build, preview and repeat the steps:

| Interaction | Before (renders) | After (renders) | After (console) |
|---|---|---|---|
| start game | App 1, ThemeSelect 1, Game 1, Panel 3, DiceTray 1, Die 5, Scoreboard 1, Scorecard 1 | same, but **no ThemeSelect** | `App update: 2.2 ms (all: 1.7 ms)` |
| roll | Game 1, Panel 3, DiceTray 1, Die 5, Scoreboard 1, Scorecard 1 | **Panel 2**, rest the same | `App update: 1.2 ms (all: 1.2 ms)` |
| hold die 1 | same as roll | **Panel 1** | `App update: 0.4 ms (all: 0.7 ms)` |
| roll again | same as roll | **Panel 1** | `App update: 0.5 ms (all: 0.8 ms)` |
| score | same as roll | **Panel 2** | `App update: 0.5 ms (all: 0.6 ms)` |
| theme → Dark | ThemeSelect 1 | ThemeSelect 1 | `App update: 0.0 ms (all: 0.3 ms)` |

What changed and why:

- `App` caches the `<ThemeSelect />` element, so starting a game no longer renders it.
- `Game` caches each `<Panel>` element. A Panel with unchanged title and children is the same element, so
  React skips it. Only Panels whose content changed render.
- Components that read the game state from context still render. Correct: their output depends on it.
- `Die` still renders five times. `DiceTray` builds the dice in `state.dice.map(…)`, and the dice array
  changes on every move, so each `<Die>` gets a fresh `onToggle` closure and ref callback. One `Die` render
  per hold would need code changes (`memo(Die)`, one shared `onToggle(id)` for all dice, no inline ref
  callback). Not worth it here.
- Timings barely moved: production was already about 1 ms, so the difference is noise. In development with a
  4× slowed-down CPU, the test machine's median commit went from 18.8 to 10.3 ms for a roll and from 16.4 to
  7.2 ms for a hold.

The bundle grows about 7 kB (2.8 kB gzipped): compiled code is a bit bigger and brings the small
`react/compiler-runtime` module.

### Step 7: remove the instrumentation

Undo the temporary changes:

1. Delete `src/renderLog.ts`.
2. Restore `src/main.tsx` (no `Profiler`, no `logCommit` import).
3. Remove the `countRender` import and call from the eight components.
4. Remove the `resolve: { alias: … }` line from `vite.config.ts`.

The final `vite.config.ts`:

`vite.config.ts`

```ts
/// <reference types="vitest/config" />
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // React Compiler: memoizes components and hooks automatically at build time.
    // It runs as a Babel preset; Vite itself transforms code with Oxc.
    babel({ presets: [reactCompilerPreset()] }),
  ],
  // Vitest reads its settings from the same file: https://vitest.dev/config/
  test: {
    // Simulate a browser (document, window, …) in Node for component tests.
    environment: 'jsdom',
    // Runs before every test file: adds the jest-dom matchers.
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

Nothing in `src/` changed since Chapter 15. The tests share the Vite config, so they now run the compiled
components too.

### Step 8: look at the compiled code

With `npm run dev` running, fetch a module from the dev server as the browser does:

```console
$ curl -s http://localhost:5173/src/components/Panel.tsx
```

`Panel` now looks like this (shortened; the hash varies):

```js
export function Panel(t0) {
	_s();
	const $ = _c(10);
	if ($[0] !== "0d3551f001f8b04e198ff81249521101b4022cb08b11294c19d4b32bdd69009b") {
		for (let $i = 0; $i < 10; $i += 1) {
			$[$i] = Symbol.for("react.memo_cache_sentinel");
		}
		$[0] = "0d3551f001f8b04e198ff81249521101b4022cb08b11294c19d4b32bdd69009b";
	}
	const { title, titleRef, children } = t0;
	const titleId = useId();
	const t1 = titleRef ? -1 : undefined;
	let t2;
	if ($[1] !== t1 || $[2] !== title || $[3] !== titleId || $[4] !== titleRef) {
		t2 = /* @__PURE__ */ _jsxDEV("h2", {
			id: titleId,
			ref: titleRef,
			tabIndex: t1,
			className: styles.title,
			children: title
		}, void 0, false, { /* ...source location... */ }, this);
		$[1] = t1;
		$[2] = title;
		$[3] = titleId;
		$[4] = titleRef;
		$[5] = t2;
	} else {
		t2 = $[5];
	}
	let t3;
	if ($[6] !== children || $[7] !== t2 || $[8] !== titleId) {
		t3 = /* @__PURE__ */ _jsxDEV("section", { /* ... */ children: [t2, children] }, /* ... */);
		$[6] = children;
		$[7] = t2;
		$[8] = titleId;
		$[9] = t3;
	} else {
		t3 = $[9];
	}
	return t3;
}
```

- `_c(10)` (from `react/compiler-runtime`) gives the component a 10-slot cache that lives with its state,
  like a hook.
- Each JSX element is rebuilt only if an input changed (`$[1] !== title`). Cheap expressions such as `titleRef ? -1 : undefined`
  are just recomputed. Otherwise the cached element, the same object, is returned, and React skips it.
- The hash check is development-only: hot reload clears the cache when you edit the file. `_s()` (hot reload
  bookkeeping) and `_jsxDEV` (JSX with source locations) are dev helpers too.

It's the `useMemo` you'd write by hand, applied to every value, with the dependencies worked out. The
production build is the same without the hash check (`_c(9)`).

### Checkpoint

```console
$ npm test
…
 ✓ src/App.test.tsx (19 tests) 3306ms
…
 Test Files  10 passed (10)
      Tests  83 passed (83)

$ npm run build
…
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-O_RImjVc.css    6.06 kB │ gzip:  1.70 kB
dist/assets/index-DrcWqzcU.js   243.49 kB │ gzip: 77.26 kB

✓ built in 652ms
```

(Timings and file hashes vary.) The game looks and plays exactly as in Chapter 15. With React DevTools, the
Components tab shows a **Memo ✨** badge next to `App`, `Game`, `Panel` and the other components.

The complete project at this point is in `project/ch16/`.

## Summary

- A component renders when its state changes, its parent renders, or a context it reads changes. Props
  needn't change.
- A render is a function call plus an object diff; React touches the DOM only where output differs. So
  re-renders are usually cheap.
- Setting state to an `Object.is`-equal value skips the render. Elements passed in as `children` are skipped
  when the wrapper re-renders.
- Objects, arrays and functions made during render are new every time. That matters only where something
  compares them: `memo`, dependency arrays, context values.
- `memo` skips a component when all props are equal. `useMemo` caches a value; `useCallback` caches a
  function. List every input as a dependency; the linter checks.
- `useDeferredValue` lets a slow part of the UI lag behind fast input, without a fixed delay.
- Measure first: `<Profiler>` for numbers, DevTools for "what rendered and why". Dev timings are inflated;
  profile a production build through `react-dom/profiling`.
- The React Compiler memoizes components and hooks at build time. It skips components that break the Rules
  of React. `useMemo`/`useCallback` stay as escape hatches.
- For thousands of rows, virtualize: render only what's visible.

## Exercises

1. **Move state down.** In `examples/ch16/dice-odds.demo.tsx`, stop typing a name from rendering `Odds`,
   without `useMemo`. Typing should log nothing.

   <details><summary>Solution</summary>

   Move the name state into its own component. `Odds` is no longer inside the component whose state
   changes:

   ```tsx
   function NameField() {
     const [name, setName] = useState('')
     return (
       <p>
         <label>
           Player name: <input value={name} onChange={(e) => setName(e.target.value)} />
         </label>{' '}
         Hello, {name || 'stranger'}!
       </p>
     )
   }

   export default function DiceOddsDemo() {
     const [count, setCount] = useState(8)
     const [cached, setCached] = useState(false)

     return (
       <main>
         {/* ...the Dice and useMemo labels unchanged... */}
         <NameField />
         <Profiler id="Odds" onRender={logRender}>
           <Odds count={count} cached={cached} />
         </Profiler>
       </main>
     )
   }
   ```

   After the mount line, typing `Ada` logs nothing: nothing inside the `Profiler` rendered.

   </details>

2. **Predict the renders.** Each component pushes its name to `renders` when called. Which names are recorded
   when you click **Toggle**, in what order?

   ```tsx
   const DarkContext = createContext(false)

   function Page({ children }: { children: ReactNode }) {
     renders.push('Page')
     const [dark, setDark] = useState(false)
     return (
       <DarkContext value={dark}>
         <button type="button" onClick={() => setDark(!dark)}>Toggle</button>
         <Sidebar />
         {children}
       </DarkContext>
     )
   }
   function Sidebar() { renders.push('Sidebar'); return <Logo /> }
   function Logo() { renders.push('Logo'); return <p>Logo</p> }
   function Article() { renders.push('Article'); return <Byline /> }
   function Byline() { renders.push('Byline'); return <p>{useContext(DarkContext) ? 'dark' : 'light'}</p> }

   // rendered as: <Page><Article /></Page>
   ```

   <details><summary>Solution</summary>

   `['Page', 'Sidebar', 'Logo', 'Byline']`.

   - `Page` owns the state.
   - `Sidebar` and `Logo` render because their parent did: `Page` creates `<Sidebar />` on every render.
   - `Article` is skipped: it arrives as `children`, created outside `Page`, so it's the same element.
   - `Byline` renders anyway: it reads `DarkContext`, whose value changed.

   </details>

3. **A cache that never hits.** `Standings` sorts with `useMemo`, yet the sort runs on every render of its
   parent. Why? Fix it in the parent.

   ```tsx
   function Standings({ players }: { players: Player[] }) {
     const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players])
     return <ol>{sorted.map((p) => <li key={p.name}>{p.name}</li>)}</ol>
   }

   function Scores() {
     const [ada, setAda] = useState(10)
     const [tick, setTick] = useState(0)
     return (
       <>
         <button type="button" onClick={() => setTick(tick + 1)}>Tick</button>
         <button type="button" onClick={() => setAda(ada + 20)}>Ada scores</button>
         <Standings players={[{ name: 'Ada', score: ada }, { name: 'Bo', score: 20 }]} />
       </>
     )
   }
   ```

   <details><summary>Solution</summary>

   The parent builds a new `players` array every render, so the dependency never matches and the cache
   always misses. Make the array stable in the parent, keyed on its inputs:

   ```tsx
   const players = useMemo(() => [{ name: 'Ada', score: ada }, { name: 'Bo', score: 20 }], [ada])
   // ...
   <Standings players={players} />
   ```

   Now **Tick** doesn't sort, and **Ada scores** sorts once. (The React Compiler would cache the parent's
   array for you.)

   </details>

4. **Opt out.** In the instrumented project from Step 6 (compiler on, profiling alias in place), add
   `'use no memo'` as the first line of `Game`. Rebuild, preview and hold a die. How many `Panel` renders do
   you see, and why?

   <details><summary>Solution</summary>

   ```tsx
   export function Game({ onPlayAgain, headingRef }: GameProps) {
     'use no memo'
     countRender('Game')
     // ...
   ```

   Every move logs `Panel` 3 again, for example
   `App update: 0.4 ms (all: 1.2 ms) {"Game":1,"Panel":3,"DiceTray":1,"Die":5,"Scoreboard":1,"Scorecard":1}`.
   `Panel` is still compiled, but the skipping happens in its *parent*: compiled `Game` returned the same
   cached `<Panel>` elements. Uncompiled, `Game` creates new elements each time, so React renders all three
   Panels. Remove the directive afterwards.

   </details>

5. **What does `memo` do for `useDeferredValue`?** In `examples/ch16/deferred.demo.tsx`, remove `memo` from
   `SlowList` (keep the inner function). Open the demo with the box ticked and type quickly. What changes,
   and why?

   <details><summary>Solution</summary>

   Typing stutters again, as if the box were unticked: "dice" with 30 ms between keys took 1817 ms without
   `memo`, against 176 ms with it. The console shows why:

   ```text
   SlowList ""
   SlowList ""
   SlowList "d"
   SlowList "d"
   SlowList ""
   SlowList ""
   SlowList "di"
   SlowList "di"
   …
   ```

   Each keystroke now renders `SlowList` twice: in the urgent render with the old `text` (the `""` lines),
   and in the background with the new one. (Each line shows twice because of StrictMode.) The urgent render
   blocks typing, and without `memo` it does the full 200 ms of work for nothing. With `memo` it skips
   `SlowList`, whose prop didn't change. Put `memo` back.

   </details>

Sources for this chapter: [REFERENCES.md](REFERENCES.md#chapter-16--rendering-and-performance)
