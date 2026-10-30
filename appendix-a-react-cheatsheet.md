# Appendix A — React Cheat Sheet

Every React hook and API that this course uses, grouped by job. Each entry has a signature, a small typed example
and a link to the chapter that teaches it. The rest of React 19.3's stable API is listed briefly at the end, so you
know it exists.

How to read it:

- Signatures are simplified from the type definitions in `@types/react` and `@types/react-dom` 19.3. Overloads
  and internal helper types are trimmed.
- Hooks and components come from `'react'`. DOM-only APIs come from `'react-dom'`. The root API comes from
  `'react-dom/client'`.
- Every example type-checks with the course's TypeScript settings. Examples that render something were also
  rendered in tests, and the results shown in comments are real.

## Quick index

| API | Package | What it does | Chapter |
|---|---|---|---|
| `createRoot` | react-dom/client | Mounts a React app into a DOM element | [1](01-getting-started.md) |
| `<StrictMode>` | react | Extra development-only checks | [1](01-getting-started.md), [4](04-components-and-jsx.md), [11](11-effects.md) |
| JSX, `<Fragment>`, `key` | react | Describe UI; group nodes; identify list items | [4](04-components-and-jsx.md) |
| `useState` | react | A state variable | [5](05-state-and-events.md) |
| `useReducer` | react | State updated by a reducer function | [7](07-reducers.md) |
| `useActionState` | react | State produced by an action (forms) | [9](09-forms.md), [17](17-async-react.md) |
| `useFormStatus` | react-dom | Pending status of the enclosing `<form>` | [9](09-forms.md) |
| `useId` | react | A unique id for `htmlFor`/`aria-*` | [9](09-forms.md), [15](15-accessibility.md) |
| `createContext`, `<Context value>` | react | Pass a value deep without props | [10](10-composition-and-context.md) |
| `useContext`, `use(context)` | react | Read a context | [10](10-composition-and-context.md), [17](17-async-react.md) |
| `useEffect` | react | Sync with an external system after render | [11](11-effects.md) |
| `useEffectEvent` | react | A non-reactive function for use inside an Effect | [11](11-effects.md), [13](13-custom-hooks.md) |
| `useLayoutEffect` | react | Like `useEffect`, but before the browser paints | [11](11-effects.md), [12](12-refs-and-the-dom.md) |
| `useRef` | react | A mutable box; holds DOM nodes | [12](12-refs-and-the-dom.md) |
| `ref` prop, ref callbacks | react | Get DOM nodes; pass refs to your components | [12](12-refs-and-the-dom.md) |
| `useImperativeHandle` | react | Choose what a ref to your component exposes | [12](12-refs-and-the-dom.md) |
| `flushSync` | react-dom | Apply a state update to the DOM right now | [12](12-refs-and-the-dom.md) |
| Custom hooks | — | Reuse stateful logic | [13](13-custom-hooks.md) |
| `useSyncExternalStore` | react | Subscribe to a store outside React | [13](13-custom-hooks.md) |
| `memo` | react | Skip re-rendering when props are unchanged | [16](16-rendering-and-performance.md) |
| `useMemo`, `useCallback` | react | Cache a value or a function between renders | [16](16-rendering-and-performance.md) |
| `<Profiler>` | react | Measure render time in code | [16](16-rendering-and-performance.md) |
| React Compiler | babel-plugin-react-compiler | Memoizes automatically at build time | [16](16-rendering-and-performance.md) |
| `<Suspense>` | react | Show a fallback while children load | [17](17-async-react.md), [19](19-building-and-shipping.md) |
| `use(promise)` | react | Read a promise's value; suspend while pending | [17](17-async-react.md) |
| Error boundary (`Component`) | react | Catch render errors; show a fallback | [17](17-async-react.md) |
| `useTransition`, `startTransition` | react | Mark an update as non-urgent | [17](17-async-react.md) |
| `useOptimistic` | react | Show a temporary value while an action runs | [17](17-async-react.md) |
| `useDeferredValue` | react | Let part of the UI lag behind | [16](16-rendering-and-performance.md) |
| `createPortal` | react-dom | Render children into another DOM node | [18](18-portals-and-dialogs.md) |
| `lazy` | react | Load a component's code on first render | [19](19-building-and-shipping.md) |
| `act` + Testing Library | react, @testing-library/* | Render and interact in tests | [8](08-testing.md), [11](11-effects.md), [13](13-custom-hooks.md), [17](17-async-react.md) |

## The rules of hooks

A *hook* is a function whose name starts with `use`. React stores each component's hook data in a list, in call
order. So the order must be the same on every render ([Chapter 5](05-state-and-events.md),
[Chapter 13](13-custom-hooks.md)):

- Call hooks only at the top level of a component or of another hook.
- Never call them inside conditions, loops, nested functions, `try`/`catch` or after an early `return`.
- Never call them from plain functions, class components or event handlers.
- `use` is the exception: you may call it inside `if`, loops and after an early return (still not in
  `try`/`catch`; [Chapter 17](17-async-react.md)).

Oxlint's `rules-of-hooks` rule catches most mistakes before you run the code.

## Rendering an app

### `createRoot`

```ts
function createRoot(container: Element | DocumentFragment, options?: RootOptions): Root
interface Root {
  render(children: ReactNode): void
  unmount(): void
}
```

Takes over a DOM element and renders your app inside it. Call it once, in `src/main.tsx`.

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// root.unmount() would remove the app and run every cleanup function.
```

Taught in [Chapter 1](01-getting-started.md).

### `<StrictMode>`

```ts
<StrictMode>{children}</StrictMode>
```

Turns on development-only checks for its subtree. In development React:

- calls each component (and initializer, updater and reducer) **twice** per render, to expose impure code;
- runs each Effect's setup, cleanup, setup on mount, to expose missing cleanups;
- runs ref callbacks twice in the same way.

Production builds skip all of this. See the example above. Taught in [Chapter 1](01-getting-started.md),
[Chapter 4](04-components-and-jsx.md) (double render) and [Chapter 11](11-effects.md) (double Effects).

## Components and JSX

### JSX rules

| Rule | Example |
|---|---|
| A component is a function that returns JSX; its name starts with a capital letter | `function Die() { return <div /> }` |
| Return one root element; use a fragment to group without a wrapper | `<>…</>` |
| `{}` embeds any JavaScript expression | `<p>Rolls left: {rollsLeft}</p>` |
| `className`, not `class`; `htmlFor`, not `for` | `<label htmlFor={id} className="hint">` |
| Event props are camelCase and take functions | `onClick={() => roll()}` |
| `style` takes an object with camelCase keys | `style={{ fontSize: '2rem' }}` |
| Every tag must close | `<input />`, `<br />` |
| `true`, `false`, `null` and `undefined` render nothing | `{held && <span>Held</span>}` |
| Lists need a stable, unique `key` per item | `dice.map((d) => <Die key={d.id} … />)` |

JSX compiles to `jsx()` calls from `react/jsx-runtime`; `key` becomes a separate argument
([Chapter 4](04-components-and-jsx.md)).

### Components, props and `children`

```ts
type ReactNode = ReactElement | string | number | bigint | Iterable<ReactNode> | boolean | null | undefined
  | Promise<AwaitedReactNode>
```

Props are one object, typed with an interface. `children` is whatever sits between the tags.

```tsx
import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  note?: string
  children: ReactNode
}

export function Panel({ title, note, children }: PanelProps) {
  return (
    <section>
      <h2>{title}</h2>
      {note && <p className="hint">{note}</p>}
      {children}
    </section>
  )
}

// <Panel title="Dice" note="Click a die to hold it.">…</Panel>
```

Gotcha: `{count && <p>…</p>}` renders `0` when `count` is `0`. Use `{count > 0 && …}`. Taught in
[Chapter 4](04-components-and-jsx.md).

### `<Fragment>` and `key`

```ts
<Fragment key?={Key} ref?={Ref<FragmentInstance>}>{children}</Fragment>   // short form: <>…</>
```

Groups children without adding a DOM node. Use the long form when a fragment in a list needs a `key`.

```tsx
import { Fragment } from 'react'

interface Line {
  id: string
  label: string
  points: number
}

export function ScoreList({ lines }: { lines: Line[] }) {
  return (
    <dl>
      {lines.map((line) => (
        <Fragment key={line.id}>
          <dt>{line.label}</dt>
          <dd>{line.points}</dd>
        </Fragment>
      ))}
    </dl>
  )
}
```

A missing `key` logs `Each child in a list should have a unique "key" prop.` in development. Taught in
[Chapter 4](04-components-and-jsx.md); Fragment refs are shown in [Chapter 20](20-where-next.md).

## State

### `useState`

```ts
function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]
type SetStateAction<S> = S | ((previous: S) => S)
```

Gives a component a value that survives re-renders. Calling the setter schedules a new render with the new value.

```tsx
import { useState } from 'react'

export function RollLog() {
  const [rolls, setRolls] = useState(0)
  // A function as the initial value runs only on the first render.
  const [log, setLog] = useState<string[]>(() => [])

  function roll() {
    setRolls((n) => n + 1) // updater: works from the latest value
    setLog((entries) => [...entries, `roll ${entries.length + 1}`]) // a new array; never push()
  }

  return (
    <button onClick={roll}>
      Rolls: {rolls} (log: {log.join(', ')})
    </button>
  )
}
// After two clicks: "Rolls: 2 (log: roll 1, roll 2)"
```

- State is a snapshot: `rolls` keeps its value until the next render.
- React batches all updates from one event into one render.
- React compares old and new state with `Object.is`. Mutating an object or array in place renders nothing.

Taught in [Chapter 5](05-state-and-events.md).

### `useReducer`

```ts
function useReducer<S, A extends [] | [any]>(reducer: (state: S, ...args: A) => S, initialState: S): [S, ActionDispatch<A>]
function useReducer<S, I, A extends [] | [any]>(reducer: (state: S, ...args: A) => S, initialArg: I, init: (arg: I) => S): [S, ActionDispatch<A>]
```

(React 19's types, simplified.) `A` is the reducer's argument list after `state`: `[action: Action]`, or `[]`
for a reducer without actions. `ActionDispatch<[Action]>` is `(action: Action) => void`. TypeScript infers
both from the reducer; write no type arguments. To type a `dispatch` prop, `Dispatch<Action>` still fits.

Moves update logic into a pure function `(state, action) => nextState`. Components only `dispatch` actions.

```tsx
import { useReducer } from 'react'

type Action = { type: 'add'; points: number } | { type: 'reset' }

function scoreReducer(total: number, action: Action): number {
  switch (action.type) {
    case 'add':
      return total + action.points
    case 'reset':
      return 0
  }
}

export function ScoreKeeper() {
  const [total, dispatch] = useReducer(scoreReducer, 0)
  return (
    <>
      <p>Total: {total}</p>
      <button onClick={() => dispatch({ type: 'add', points: 25 })}>Full House</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </>
  )
}
```

Return the same state object to mean "nothing changed"; React then skips the re-render. `dispatch` never
changes identity. The game passes an `init` function as the third argument:
`useReducer(gameReducer, null, () => saved ?? createGame(setup))`. Taught in [Chapter 7](07-reducers.md).

## Context

### `createContext`, `<Context value>`, `useContext` and `use(context)`

```ts
function createContext<T>(defaultValue: T): Context<T>
<Context value={T}>{children}</Context>          // React 19: the context is its own provider
function useContext<T>(context: Context<T>): T
function use<T>(usable: Context<T> | Promise<T>): T
```

A context passes a value to every component below the provider, at any depth. Readers re-render when the value
changes (compared with `Object.is`). With no provider above, a reader gets the default value.

```tsx
import { createContext, use, useContext, useState } from 'react'

type Theme = 'light' | 'dark'
const ThemeContext = createContext<Theme>('light')

function Badge() {
  const theme = useContext(ThemeContext)
  return <span>Badge: {theme}</span>
}

function OptionalBadge({ show }: { show: boolean }) {
  if (!show) return null
  const theme = use(ThemeContext) // use() is allowed after an early return
  return <span>Optional: {theme}</span>
}

export function ThemedApp() {
  const [theme, setTheme] = useState<Theme>('dark')
  return (
    <ThemeContext value={theme}>
      <Badge />
      <OptionalBadge show />
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Toggle</button>
    </ThemeContext>
  )
}
```

`<Context.Provider value>` still works but is no longer needed. Split often-changing state and the stable
`dispatch` into two contexts, as the game does. Taught in [Chapter 10](10-composition-and-context.md);
`use(context)` in [Chapter 17](17-async-react.md).

## Effects

### `useEffect`

```ts
function useEffect(setup: () => void | (() => void), deps?: readonly unknown[]): void
```

Runs `setup` after React has updated the screen. Use it to sync with something outside React: timers,
subscriptions, `document.title`, `localStorage`, a non-React widget. The returned function is the cleanup.

```tsx
import { useEffect, useState } from 'react'

export function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000) // connect
    return () => clearInterval(id) // disconnect
  }, []) // no dependencies: set up once after mounting, clean up when removed

  return <p>{now.toLocaleTimeString()}</p>
}
```

| `deps` | Setup runs |
|---|---|
| omitted | after every render |
| `[]` | once after mounting |
| `[a, b]` | after mounting, and after any render where `a` or `b` changed (`Object.is`) |

Before each re-run and on unmount, React runs the previous cleanup. You might not need an Effect at all:
compute derived values during render, and put logic for a specific event in its event handler. Taught in
[Chapter 11](11-effects.md).

### `useEffectEvent`

```ts
function useEffectEvent<T extends Function>(callback: T): T
```

Wraps a function so an Effect can call it and always get the latest props and state, without listing them as
dependencies. Stable since React 19.2. Call the result only from inside Effects.

```tsx
import { useEffect, useEffectEvent } from 'react'

export function useKeyDown(onKey: (key: string) => void) {
  // Always calls the latest onKey, but is not a dependency.
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => onKey(event.key))

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, []) // subscribes once, even when onKey changes on every render
}
```

Taught in [Chapter 11](11-effects.md); the game's `useKeyboardShortcuts` hook comes in
[Chapter 13](13-custom-hooks.md).

### `useLayoutEffect`

```ts
function useLayoutEffect(setup: () => void | (() => void), deps?: readonly unknown[]): void
```

Same as `useEffect`, but runs after the DOM update and **before** the browser paints. Use it to measure
layout and re-render before the user sees the first result. It blocks painting, so prefer `useEffect`.

```tsx
import { useLayoutEffect, useRef, useState } from 'react'

export function Measured() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    setWidth(ref.current?.getBoundingClientRect().width ?? 0)
  }, [])

  return <div ref={ref}>This box is {width}px wide</div>
}
```

Taught in [Chapter 11](11-effects.md) (timing) and [Chapter 12](12-refs-and-the-dom.md) (measuring); the game
doesn't need it.

## Refs and the DOM

### `useRef`

```ts
function useRef<T>(initialValue: T): RefObject<T>                 // interface RefObject<T> { current: T }
function useRef<T>(initialValue: T | null): RefObject<T | null>
```

A box whose `current` survives re-renders. Changing it does **not** re-render. Two uses: hold a DOM node
(pass the ref to an element's `ref` prop), or hold a mutable value such as a timer id.

```tsx
import { useRef } from 'react'

export function NameField() {
  const inputRef = useRef<HTMLInputElement>(null) // React fills in the DOM node
  const edits = useRef(0) // a plain mutable value

  function edit() {
    edits.current++
    inputRef.current?.focus()
  }

  return (
    <>
      <input ref={inputRef} aria-label="Name" />
      <button onClick={edit}>Edit name</button>
    </>
  )
}
```

Don't read or write `ref.current` during render (except to initialize it); do it in event handlers and Effects.
Taught in [Chapter 12](12-refs-and-the-dom.md).

### `ref` as a prop, and ref callbacks

```ts
type Ref<T> = RefObject<T | null> | ((node: T | null) => void | (() => void)) | null
```

In React 19, `ref` is an ordinary prop of function components: no `forwardRef`. A ref can also be a callback.
React calls it with the node after mounting. If it returns a cleanup function, React calls that before removing
the node.

```tsx
import { useRef, type Ref } from 'react'

interface FaceProps {
  value: number
  ref?: Ref<HTMLButtonElement>
}

export function Face({ value, ref }: FaceProps) {
  return <button ref={ref}>{value}</button>
}

export function Faces({ dice }: { dice: { id: number; value: number }[] }) {
  const nodes = useRef(new Map<number, HTMLButtonElement>())
  return dice.map((die) => (
    <Face
      key={die.id}
      value={die.value}
      ref={(node) => {
        if (!node) return
        nodes.current.set(die.id, node)
        return () => {
          nodes.current.delete(die.id)
        }
      }}
    />
  ))
}
```

An inline ref callback is a new function on every render, so React runs its cleanup and calls it again each time.
That's fine when it has a cleanup. Taught in [Chapter 12](12-refs-and-the-dom.md).

### `useImperativeHandle`

```ts
function useImperativeHandle<T>(ref: Ref<T> | undefined, create: () => T, deps?: readonly unknown[]): void
```

Makes a ref to your component expose a small object of your choice instead of a DOM node.

```tsx
import { useImperativeHandle, useRef, type Ref } from 'react'

export interface ShakerHandle {
  shake(): void
}

export function Shaker({ ref }: { ref?: Ref<ShakerHandle> }) {
  const divRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => ({
    shake() {
      divRef.current?.animate([{ rotate: '0deg' }, { rotate: '20deg' }, { rotate: '0deg' }], 300)
    },
  }))
  return <div ref={divRef}>⚂</div>
}
```

Rarely needed: prefer props. Taught in [Chapter 12](12-refs-and-the-dom.md).

### `flushSync`

```ts
function flushSync<R>(fn: () => R): R
```

Runs `fn` and applies its state updates to the DOM before returning. Use it when the very next line needs the
updated DOM, for example to focus or scroll to a new element. It's slow; use it rarely.

```tsx
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

export function PlayerList() {
  const [names, setNames] = useState<string[]>([])
  const listRef = useRef<HTMLUListElement>(null)

  function add() {
    flushSync(() => setNames([...names, `Player ${names.length + 1}`]))
    console.log(listRef.current?.children.length) // the new <li> is already there: 1, then 2, …
  }

  return (
    <>
      <button onClick={add}>Add player</button>
      <ul ref={listRef}>
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </>
  )
}
```

The game uses it to focus the Roll button right after scoring. Taught in [Chapter 12](12-refs-and-the-dom.md).

## Custom hooks and external stores

### Custom hooks

A function named `useSomething` that calls other hooks. It shares *logic*, not state: each component that calls
it gets its own state. See the `useKeyDown` and `useOnline` examples on this page. Taught in
[Chapter 13](13-custom-hooks.md).

### `useSyncExternalStore`

```ts
function useSyncExternalStore<Snapshot>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot?: () => Snapshot,
): Snapshot
```

Reads a value that lives outside React (a browser API, a store) and re-renders when it changes. `subscribe`
registers a listener and returns an unsubscribe function. `getSnapshot` must return the same value (by
`Object.is`) while nothing has changed, so return primitives or cached objects.

```tsx
import { useDebugValue, useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

export function useOnline(): boolean {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine)
  useDebugValue(online ? 'Online' : 'Offline') // label shown in React DevTools
  return online
}
```

Define `subscribe` outside the component. A new function on every render would make React re-subscribe every
time. The game uses this hook for `localStorage` and `matchMedia`. Taught in [Chapter 13](13-custom-hooks.md).
`useDebugValue(value, format?)` only labels a custom hook in React DevTools; the chapters don't use it.

## Forms and Actions

### `<form action>`, `useActionState`, `useFormStatus` and `useId`

```ts
<form action={(formData: FormData) => void | Promise<void>}>
function useActionState<State, Payload>(
  action: (state: State, payload: Payload) => State | Promise<State>,
  initialState: State,
): [state: State, dispatch: (payload: Payload) => void, isPending: boolean]
function useFormStatus(): { pending: boolean; data: FormData | null; method: string | null; action: … }
function useId(): string
```

- Passing a function to `<form action>` makes it an *Action*. React calls it with the form's `FormData`.
  After it succeeds, React resets the form's uncontrolled fields.
- `useActionState` wraps an action. It keeps what the action returns as state and tracks `isPending`.
- `useFormStatus` reads the status of the `<form>` that contains the calling component. It must be called in a
  child component of the form, not in the component that renders the `<form>`.
- `useId` returns an id that is unique on the page. Use it to pair labels with inputs. Never use it for `key`.

```tsx
import { useActionState, useId } from 'react'
import { useFormStatus } from 'react-dom'

interface JoinState {
  error: string | null
  players: string[]
}

async function join(previous: JoinState, formData: FormData): Promise<JoinState> {
  const name = String(formData.get('name') ?? '').trim()
  if (name === '') return { ...previous, error: 'Enter a name.' }
  return { error: null, players: [...previous.players, name] }
}

function JoinButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>{pending ? 'Joining…' : 'Join'}</button>
}

export function JoinForm() {
  const id = useId()
  const [state, formAction] = useActionState(join, { error: null, players: [] })
  return (
    <form action={formAction}>
      <label htmlFor={id}>Name</label>
      <input id={id} name="name" />
      <JoinButton />
      {state.error && <p role="alert">{state.error}</p>}
      <p>Players: {state.players.join(', ') || 'none'}</p>
    </form>
  )
}
// Type "Ada", click Join: "Players: Ada", and the input is empty again.
```

Taught in [Chapter 9](09-forms.md). [Chapter 17](17-async-react.md) uses `useActionState` with an async action
and its `isPending` flag.

## Performance

### `memo`, `useMemo` and `useCallback`

```ts
function memo<P>(Component: (props: P) => ReactNode, arePropsEqual?: (prev: P, next: P) => boolean): MemoExoticComponent
function useMemo<T>(calculate: () => T, deps: readonly unknown[]): T
function useCallback<T extends Function>(fn: T, deps: readonly unknown[]): T
```

- `memo(Component)` skips re-rendering when every prop is `Object.is`-equal to last time.
- `useMemo` caches a computed value until a dependency changes.
- `useCallback` caches a function, so a `memo` child gets the same function object every time.

```tsx
import { memo, useCallback, useMemo, useState } from 'react'

interface DieProps {
  id: number
  value: number
  onToggle: (id: number) => void
}

const Die = memo(function Die({ id, value, onToggle }: DieProps) {
  return <button onClick={() => onToggle(id)}>{value}</button>
})

export function Tray({ dice }: { dice: { id: number; value: number }[] }) {
  const [held, setHeld] = useState<number[]>([])
  const toggle = useCallback((id: number) => {
    setHeld((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))
  }, [])
  const total = useMemo(() => dice.reduce((sum, die) => sum + die.value, 0), [dice])

  return (
    <>
      {dice.map((die) => (
        <Die key={die.id} id={die.id} value={die.value} onToggle={toggle} />
      ))}
      <p>
        Total {total}, held {held.length}
      </p>
    </>
  )
}
```

Measure first. With the React Compiler on, you rarely write these by hand. Taught in
[Chapter 16](16-rendering-and-performance.md).

### `<Profiler>`

```ts
<Profiler id={string} onRender={ProfilerOnRenderCallback}>{children}</Profiler>
type ProfilerOnRenderCallback = (id: string, phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number, baseDuration: number, startTime: number, commitTime: number) => void
```

Calls `onRender` after each commit of its subtree, with timings in milliseconds. It works in development and in
React's profiling build, and is disabled in normal production builds.

```tsx
import { Profiler, type ProfilerOnRenderCallback } from 'react'

const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
  console.log(`${id} ${phase} took ${actualDuration.toFixed(1)} ms`)
}

export function MeasuredBoard() {
  return (
    <Profiler id="Board" onRender={onRender}>
      <p>The board</p>
    </Profiler>
  )
}
// Logs "Board mount took 0.1 ms" (your timings will differ).
```

Taught in [Chapter 16](16-rendering-and-performance.md), with the Profiler tab of React DevTools.

### React Compiler

A build-time Babel plugin (`babel-plugin-react-compiler` 1.0) that memoizes components and hooks for you. It
needs your code to follow the Rules of React (pure renders, the rules of hooks). The course's setup in
`vite.config.ts`:

```ts
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
})
```

Opt one function out with the directive `'use no memo'` as its first statement. Taught in
[Chapter 16](16-rendering-and-performance.md).

## Async React

### `<Suspense>`, `use(promise)` and error boundaries

```ts
<Suspense fallback={ReactNode}>{children}</Suspense>
function use<T>(usable: Promise<T> | Context<T>): T
class Component<P, S> {
  static getDerivedStateFromError?(error: unknown): Partial<S>   // render phase: switch to the fallback
  componentDidCatch?(error: unknown, info: ErrorInfo): void      // commit phase: report
}
```

- `use(promise)` returns the value of a resolved promise. While it is pending, the component *suspends*: the
  closest `<Suspense>` shows its fallback. If the promise rejects, the closest error boundary catches the error.
- Create the promise outside render (in a `useState` initializer, an event handler or a cache). A new promise
  on every render would suspend forever.
- An *error boundary* is a class component with `getDerivedStateFromError`. There is no hook version. It catches
  errors thrown during render, not in event handlers or async code.

```tsx
import { Component, Suspense, use, useState, type ErrorInfo, type ReactNode } from 'react'

function fetchTopScores(): Promise<number[]> {
  return new Promise((resolve) => setTimeout(() => resolve([270, 181]), 300))
}

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.warn('Caught:', error, info.componentStack)
  }

  render() {
    return this.state.failed ? <p role="alert">Couldn't load the scores.</p> : this.props.children
  }
}

function TopScore({ scores }: { scores: Promise<number[]> }) {
  const [best] = use(scores)
  return <p>Top score: {best}</p>
}

export function Leaderboard() {
  const [scores] = useState(fetchTopScores) // created once, on the first render
  return (
    <ErrorBoundary>
      <Suspense fallback={<p>Loading…</p>}>
        <TopScore scores={scores} />
      </Suspense>
    </ErrorBoundary>
  )
}
// Shows "Loading…", then "Top score: 270".
```

Taught in [Chapter 17](17-async-react.md).

### `useTransition` and `startTransition`

```ts
function useTransition(): [isPending: boolean, startTransition: (action: () => void | Promise<void>) => void]
function startTransition(action: () => void | Promise<void>): void
```

Marks state updates as non-urgent. React keeps showing the current UI (instead of a Suspense fallback) while the
new UI gets ready, and urgent updates such as typing can interrupt it. `useTransition` adds an `isPending` flag;
the standalone `startTransition` doesn't.

```tsx
import { useState, useTransition } from 'react'

export function Tabs() {
  const [tab, setTab] = useState('dice')
  const [isPending, startTransition] = useTransition()

  function select(next: string) {
    startTransition(() => setTab(next))
  }

  return (
    <>
      <button onClick={() => select('dice')}>Dice</button>
      <button onClick={() => select('scores')}>Scores</button>
      <p style={{ opacity: isPending ? 0.5 : 1 }}>Showing {tab}</p>
    </>
  )
}
```

An async function passed to `startTransition` is an Action. State updates after an `await` inside it need their
own `startTransition(() => …)`. Taught in [Chapter 17](17-async-react.md).

### `useOptimistic`

```ts
function useOptimistic<State, Action>(
  passthrough: State,
  reducer: (current: State, action: Action) => State,
): [State, (action: Action) => void]
```

Shows a temporary state while an Action runs. When the Action finishes, React drops the optimistic value and shows
`passthrough` again (by then it holds the real result). Call the setter inside an Action or transition.

```tsx
import { startTransition, useOptimistic, useState } from 'react'

function save(name: string): Promise<string> {
  return new Promise((resolve) => setTimeout(() => resolve(name), 300))
}

export function Players() {
  const [players, setPlayers] = useState<string[]>([])
  const [shown, addPending] = useOptimistic(players, (current: string[], name: string) => [
    ...current,
    `${name} (saving…)`,
  ])

  function add(name: string) {
    startTransition(async () => {
      addPending(name) // on screen at once
      const saved = await save(name)
      startTransition(() => setPlayers((current) => [...current, saved]))
    })
  }

  return (
    <>
      <button onClick={() => add('Ada')}>Add Ada</button>
      <ul>
        {shown.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </>
  )
}
// Click: "Ada (saving…)" at once, then "Ada".
```

Taught in [Chapter 17](17-async-react.md).

### `useDeferredValue`

```ts
function useDeferredValue<T>(value: T, initialValue?: T): T
```

Returns a copy of `value` that may lag behind during heavy rendering. The urgent part of the UI (the input) uses
the fresh value; the slow part (a long list) uses the deferred one.

```tsx
import { useDeferredValue, useState } from 'react'

export function Search({ names }: { names: string[] }) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const matches = names.filter((name) => name.toLowerCase().includes(deferredQuery.toLowerCase()))
  const stale = query !== deferredQuery

  return (
    <>
      <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search" />
      <ul style={{ opacity: stale ? 0.5 : 1 }}>
        {matches.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </>
  )
}
```

It only helps when the slow part can skip rendering, for example a `memo` list component. Taught in
[Chapter 16](16-rendering-and-performance.md#usedeferredvalue-keep-typing-fast-while-a-slow-part-catches-up).

### `lazy`

```ts
function lazy<T extends ComponentType>(load: () => Promise<{ default: T }>): LazyExoticComponent<T>
```

Loads a component's code the first time it renders. The bundler puts the dynamic `import()` in a separate file.
Render it inside `<Suspense>`. Call `lazy` at module level, never inside a component.

```tsx
import { lazy, Suspense, useState } from 'react'

// lazy() wants a default export; this turns a named export into one.
const RulesDialog = lazy(() => import('./RulesDialog').then((module) => ({ default: module.RulesDialog })))

export function RulesButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Rules</button>
      {open && (
        <Suspense fallback={<p>Loading rules…</p>}>
          <RulesDialog onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
```

Taught in [Chapter 19](19-building-and-shipping.md).

## Portals

### `createPortal`

```ts
function createPortal(children: ReactNode, container: Element | DocumentFragment, key?: Key | null): ReactPortal
```

Renders children into another DOM node, such as `document.body`. In React's tree the portal stays where you
rendered it: it still reads context, and its events bubble to its React parents.

```tsx
import { createPortal } from 'react-dom'

export function Toast({ message }: { message: string }) {
  return createPortal(<p role="status">{message}</p>, document.body)
}
```

The game renders its `<dialog>` elements this way. Taught in [Chapter 18](18-portals-and-dialogs.md).

## Testing

`act` comes from `react`; Testing Library re-exports it and wraps `render` and its events in it for you.

| API | From | Use | Chapter |
|---|---|---|---|
| `render(ui)` | @testing-library/react | Render into a jsdom document | [8](08-testing.md) |
| `screen.getByRole(role, { name })` | @testing-library/react | Find an element the way a user would; throws if missing | [8](08-testing.md) |
| `getByLabelText`, `getByText` | @testing-library/react | Next-best queries | [8](08-testing.md) |
| `queryBy…` / `findBy…` | @testing-library/react | `null` instead of throwing / wait for it (async) | [8](08-testing.md) |
| `within(element)` | @testing-library/react | Queries limited to one element | [8](08-testing.md) |
| `waitFor(fn)` | @testing-library/react | Retry an assertion until it passes | [8](08-testing.md) |
| `userEvent.setup()`, `await user.click(el)`, `user.type`, `user.keyboard` | @testing-library/user-event | Realistic input | [8](08-testing.md) |
| `fireEvent.click(el)` | @testing-library/react | Dispatch one DOM event (wrap it in `await act(async () => …)` when the click suspends) | [17](17-async-react.md) |
| `cleanup()` | @testing-library/react | Unmount everything (call it in `afterEach`) | [8](08-testing.md) |
| `renderHook(() => useX())` | @testing-library/react | Test a custom hook | [13](13-custom-hooks.md) |
| `act(async () => …)` | react (via Testing Library) | Flush updates, Effects and Suspense | [13](13-custom-hooks.md), [17](17-async-react.md) |

```tsx
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it } from 'vitest'

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
}

it('counts clicks', async () => {
  const user = userEvent.setup()
  render(<Counter />)
  await user.click(screen.getByRole('button', { name: 'Clicked 0 times' }))
  expect(screen.getByRole('button')).toHaveTextContent('Clicked 1 times')
})

it('tests a hook on its own', () => {
  const { result } = renderHook(() => useState(0))
  act(() => result.current[1](5))
  expect(result.current[0]).toBe(5)
})
```

## Types you will use

| Type | From | Meaning |
|---|---|---|
| `ReactNode` | react | Anything renderable: elements, strings, numbers, arrays, `null`… (type of `children`) |
| `ReactElement` | react | The object a JSX expression creates |
| `Ref<T>`, `RefObject<T>` | react | A ref prop / the object `useRef` returns |
| `PropsWithChildren<P>` | react | `P` plus an optional `children?: ReactNode` |
| `Dispatch<A>`, `SetStateAction<S>` | react | A `dispatch` function or setter as a prop: `Dispatch<SetStateAction<number>>` is `setCount`'s type |
| `ActionDispatch<[A]>` | react | What `useReducer` returns as `dispatch` (inferred; `Dispatch<A>` is interchangeable) |
| `ComponentProps<'button'>` | react | All props of an element (or of a component: `ComponentProps<typeof Die>`) |
| `ComponentPropsWithoutRef<'button'>` | react | The same without `ref`, for wrappers that don't forward it |
| `CSSProperties` | react | The `style` object |
| `ChangeEvent<HTMLInputElement>`, `MouseEvent<…>`, `KeyboardEvent<…>`, `FormEvent<…>` | react | React's event objects |
| `ErrorInfo` | react | Second argument of `componentDidCatch` (`componentStack`) |
| `ProfilerOnRenderCallback` | react | The `onRender` function of `<Profiler>` |

```tsx
import type { ChangeEvent, ComponentProps, CSSProperties, KeyboardEvent, ReactNode } from 'react'

type IconButtonProps = ComponentProps<'button'> & { icon: ReactNode }

export function IconButton({ icon, children, ...rest }: IconButtonProps) {
  return (
    <button {...rest}>
      {icon} {children}
    </button>
  )
}

const big: CSSProperties = { fontSize: '1.5rem' }

export function NameInput({ onName }: { onName: (name: string) => void }) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onName(event.target.value)
  }
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') onName('')
  }
  return <input style={big} onChange={handleChange} onKeyDown={handleKeyDown} aria-label="Name" />
}
```

A generic component: the type parameter goes on the function, and TypeScript infers it from the props
([Chapter 10](10-composition-and-context.md)):

```tsx
import type { ReactNode } from 'react'

type ListProps<T> = { items: T[]; getKey: (item: T) => string; renderItem: (item: T) => ReactNode }

export function List<T>({ items, getKey, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={getKey(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}

// <List items={players} getKey={(p) => p.name} renderItem={(p) => p.name} />: T is Player
```

Gotcha: `KeyboardEvent` imported from `react` is React's event type, for props like `onKeyDown`. Without the
import, `KeyboardEvent` is the DOM's own type, for `window.addEventListener('keydown', …)`. The game's keyboard
shortcuts use the DOM type ([Chapter 11](11-effects.md)).

## Other stable React 19.3 APIs

The game doesn't use these. [Chapter 20](20-where-next.md) demonstrates `<Activity>`, `<ViewTransition>`,
Fragment refs and `browser()`, and introduces Server Components; read the rest on
[react.dev](https://react.dev/reference/react) when you need them.

| API | Package | Signature | What it does |
|---|---|---|---|
| `useInsertionEffect` | react | `(setup, deps?) => void` | Runs before React changes the DOM; for CSS-in-JS libraries that insert `<style>` tags |
| `useDebugValue` | react | `(value, format?) => void` | Labels a custom hook in React DevTools |
| `<Activity>` | react | `<Activity mode="visible" \| "hidden">` | Hides children (`display: none`) but keeps their state; their Effects are cleaned up while hidden (stable since 19.2) |
| `<ViewTransition>` | react | `<ViewTransition enter? exit? update? name?>` | Animates children with the browser's View Transition API when a Transition changes them (stable in 19.3) |
| `addTransitionType` | react | `(type: string) => void` | Labels the cause of a Transition, to pick a `<ViewTransition>` animation (19.3) |
| Fragment refs | react | `<Fragment ref={ref}>` | A `FragmentInstance` to focus, observe or add listeners to a fragment's DOM children (19.3) |
| `captureOwnerStack` | react | `() => string \| null` | The component "owner stack" in development, for error reports |
| `cache` | react | `(fn) => fn` | Memoizes a function per server request; Server Components only |
| `cacheSignal` | react | `() => AbortSignal \| null` | Tells you when a `cache()` lifetime ends; Server Components only |
| `browser` | react-dom | `use(browser(reason?))` | Marks a component as browser-only during server rendering (19.3) |
| `requestFormReset` | react-dom | `(form: HTMLFormElement) => void` | Resets a form after the current Action, as `<form action>` does |
| `preload`, `preinit`, `preconnect`, `prefetchDNS`, `preloadModule`, `preinitModule` | react-dom | `(href, options?) => void` | Ask the browser to fetch fonts, scripts, styles or connections early |
| `hydrateRoot` | react-dom/client | `(container, ui, options?) => Root` | Attaches React to HTML that a server already rendered |
| `renderToReadableStream`, `renderToPipeableStream`, `resume…`, `renderToString` | react-dom/server | — | Render components to HTML on a server |
| `prerender`, `prerenderToNodeStream` | react-dom/static | — | Render components to static HTML at build time |
| `<title>`, `<meta>`, `<link>` in components | react-dom | — | React moves them into `<head>` |
| `'use client'`, `'use server'` | directives | — | Mark the boundary between Server and Client Components; Server Functions ([Chapter 20](20-where-next.md)) |

**Legacy APIs** still work but aren't for new code: `Children`, `cloneElement`, `createElement` (JSX calls the
`jsx()` runtime instead), `createRef`, `forwardRef` (use `ref` as a prop), `isValidElement`, `PureComponent`, and
`Component` except for error boundaries.

**Removed in React 19:** `ReactDOM.render` and `hydrate` (use `createRoot` and `hydrateRoot`),
`unmountComponentAtNode` (use `root.unmount()`), `findDOMNode` (use refs), `createFactory`, `propTypes` (use
TypeScript), string refs and legacy context.

Sources for this chapter: [REFERENCES.md](REFERENCES.md#appendix-a--react-cheat-sheet)
