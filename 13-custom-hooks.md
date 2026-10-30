# Chapter 13 — Custom Hooks

Components share UI by composing components. To share *logic* that uses Hooks, you write your own Hook: a plain function whose name starts with `use`. This chapter covers writing one, the rules all Hooks follow and why, and `useSyncExternalStore`, for data outside React such as media queries and `localStorage`. In the project, the logic from [Chapter 11](11-effects.md) and [Chapter 12](12-refs-and-the-dom.md) moves into named Hooks, and a high-score table survives reloads. [Chapter 14](14-styling.md) then styles the game.

## A custom Hook is a function that calls Hooks

A counter's logic, pulled out of a component:

`examples/ch13/use-counter.ts`

```ts
import { useState } from 'react'

/** A number that counts up in steps, with a reset. A custom Hook: a function that calls Hooks. */
export function useCounter(step = 1) {
  const [count, setCount] = useState(0)

  return {
    count,
    increment: () => setCount((c) => c + step),
    reset: () => setCount(0),
  }
}
```

No special API: `useCounter` takes any arguments and returns anything (a value, a tuple like `useState`, or an object as here). Components call it like a built-in Hook:

`examples/ch13/counter.demo.tsx`

```tsx
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
```

Run `npm run dev` in `examples/` and open `http://localhost:5173/?demo=ch13/counter`. The two counters count separately.

### Hooks share logic, not state

Calling `useCounter` is like pasting its body into the component: each call gets its own `useState`, so each `Counter` has its own `count`. Think of a class instantiated once per component, not a singleton.

To share data, lift state up ([Chapter 6](06-thinking-in-react.md)), use context ([Chapter 10](10-composition-and-context.md)), or keep it outside React in an *external store*, as the project's `useLocalStorage` does later in this chapter.

### Naming: why the `use` prefix matters

Tools find Hooks by name, not by type. A function that calls Hooks must be named `use` plus a capital letter (`useCounter`). One that calls none should *not* start with `use` (`formatScore()`).

The prefix tells readers and the linter that the Rules of Hooks (next section) apply to the function and its callers. Oxlint's `react-hooks` rules check every `use…` function and every component (a capitalized function), so a Hook call hidden in an unprefixed helper goes unchecked.

### When to extract a Hook

Extract when the component then says *what* it does, not *how* (`useDocumentTitle(title)` instead of six lines of `useEffect`; `usePrefersReducedMotion()` instead of `matchMedia` and its subscription), or when two components repeat the same logic. Don't extract by reflex. "Lifecycle" Hooks like `useMount(fn)` hide an effect's dependencies from the dependency-array checks; name Hooks after their purpose.

Two more cautions:

- **Returned functions are new every render**, like any function created in a component: `useCounter` returns a fresh `increment` each time. That's fine for `onClick`, but a caller that lists `increment` in an Effect's dependency array re-runs the Effect on every render. [Chapter 16](16-rendering-and-performance.md#identity-when-is-a-value-the-same) covers `useCallback` and the React Compiler, which keep functions stable.
- **Don't write your own `useFetch`.** Wrapping [Chapter 11](11-effects.md)'s fetch Effect in a Hook tidies it, but loading and error states, caching and races remain yours. Use [Chapter 17](17-async-react.md)'s `use()` and Suspense, or a library ([Chapter 20](20-where-next.md#state-and-data-libraries)).

### Testing a Hook with `renderHook`

Hooks only run inside components. Testing Library's `renderHook` renders a tiny component that calls your Hook and exposes its latest return value as `result.current`:

`examples/ch13/use-counter.test.tsx`

```tsx
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import CounterDemo from './counter.demo'
import { useCounter } from './use-counter'

it('counts in steps and resets', () => {
  // renderHook renders a tiny test component that calls the Hook.
  const { result } = renderHook(() => useCounter(5))
  expect(result.current.count).toBe(0)

  // act() applies the state update and re-renders before we look again.
  act(() => result.current.increment())
  act(() => result.current.increment())
  expect(result.current.count).toBe(10)

  act(() => result.current.reset())
  expect(result.current.count).toBe(0)
})

it('gives every component its own state', async () => {
  const user = userEvent.setup()
  render(<CounterDemo />)

  await user.click(screen.getByRole('button', { name: '+10' }))
  await user.click(screen.getByRole('button', { name: '+10' }))
  await user.click(screen.getByRole('button', { name: '+1' }))

  expect(screen.getAllByRole('paragraph').map((p) => p.textContent)).toEqual([
    'Ones: 1 +1 Reset Ones',
    'Tens: 20 +10 Reset Tens',
  ])
})
```

- Wrap state updates that don't come from user-event in `act()`; when it returns, React has re-rendered. `user.click` wraps itself in `act`, so [Chapter 8](08-testing.md) never needed it.
- Re-read `result.current` after each update. A value destructured earlier is stale.
- Use `renderHook` when the Hook is the unit; test through a real component when the component is.

```console
$ npx vitest run ch13/use-counter
 ✓ ch13/use-counter.test.tsx (2 tests) 138ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
```

(Timings vary. From here on, the `RUN` header and footer lines are omitted.)

## The Rules of Hooks

Every Hook, built-in or custom, follows two rules:

1. **Call Hooks only at the top level** of a component or custom Hook, never:
   - inside `if`, loops, or `&&`/`?:`;
   - after an early `return`;
   - in event handlers, or in callbacks passed to `useEffect`, `useMemo` or `useReducer`;
   - inside `try`/`catch`/`finally`.
2. **Call Hooks only from React functions**: components and custom Hooks; not plain functions, class components or module top level.

React 19's `use` is the one exception to rule 1: it may be called conditionally ([Chapter 17](17-async-react.md)).

### Why: Hooks are identified by call order

A Hook call has no name or key. When `Profile` calls `useState` three times, React tells them apart by position: it keeps a list of "slots" per component instance and walks it in call order each render.

This toy model isn't React's code, but fails the same way:

`examples/ch13/hook-slots.ts`

```ts
// A toy model of how React stores Hooks: each call gets the next slot in a list.
// This is not React's code, but it is the same idea.

const slots: unknown[] = []
let next = 0 // the slot the next call will use

// Our stand-in for useState. (Named toyState, not useState, so it's clearly a toy.)
function toyState<T>(initial: T): T {
  const slot = next++
  if (!(slot in slots)) slots[slot] = initial // first render: fill the slot
  return slots[slot] as T
}

function Profile(showAge: boolean): string {
  const name = toyState('Ada')
  // 🔴 A Hook call inside a condition: this breaks the call order.
  const age = showAge ? toyState(36) : '(hidden)'
  const city = toyState('London')
  return `name=${name} age=${age} city=${city}`
}

function render(showAge: boolean) {
  next = 0 // every render starts again at slot 0
  console.log(`showAge=${showAge}:`.padEnd(16), Profile(showAge).padEnd(36), JSON.stringify(slots))
}

render(true)
render(true)
render(false) // `city` now reads slot 1, which holds the age
```

```console
$ node ch13/hook-slots.ts
showAge=true:    name=Ada age=36 city=London          ["Ada",36,"London"]
showAge=true:    name=Ada age=36 city=London          ["Ada",36,"London"]
showAge=false:   name=Ada age=(hidden) city=36        ["Ada",36,"London"]
```

When the condition skips a call, every later Hook reads its neighbour's slot: `city` gets the age. Real React detects this, but only afterwards.

Why not names or keys? Call order is deliberate: no string keys to clash, two calls to the same custom Hook can't collide, and custom Hooks can call other Hooks freely, since their calls just take the next slots. The two rules are the price.

### What the linter and React say

A typical mistake, a Hook after an early return:

```tsx
function Greeting({ name }: { name: string | null }) {
  const [shy, setShy] = useState(false)
  if (name === null) return <p>Who are you?</p>
  // 🔴 A Hook after an early return
  const [waves, setWaves] = useState(0)
  // …
}
```

Saved as `ch13/early-return.demo.tsx`, the linter catches it before you run anything:

```console
$ npx oxlint ch13
  x react-hooks(rules-of-hooks): React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render.
   ,-[ch13/early-return.demo.tsx:7:29]
 6 |   // 🔴 A Hook after an early return
 7 |   const [waves, setWaves] = useState(0)
   :                             ^^^^^|^^^^^
   :                                  `-- This Hook call is not reachable on every render path.
 8 |   return (
   `----
  help: Move the Hook call before the condition, or call it unconditionally and branch inside the Hook/effect instead.

Found 0 warnings and 1 error.
```

Run it anyway: the first render (`name === null`) works. When `name` changes, React finds one more Hook than last time, logs the order it saw, and throws:

```text
React has detected a change in the order of Hooks called by Greeting. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://react.dev/link/rules-of-hooks

   Previous render            Next render
   ------------------------------------------------------
1. useState                   useState
2. undefined                  useState
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Error: Rendered more hooks than during the previous render.
```

The fix is always the same: call every Hook first, then branch. Put the condition *inside* the Hook's logic (an `if` in the effect body, a value you ignore), not around the call.

## Reading the outside world: `useSyncExternalStore`

Some data lives outside React and changes on its own:

- whether a media query matches (window width, dark mode, "reduce motion");
- `localStorage`, which other tabs can change;
- `navigator.onLine`, a WebSocket's state, a third-party store.

React calls this an *external store*. Copying it into state with `useState` and a subscribing `useEffect` lags a render and is easy to get wrong. Use the dedicated Hook:

```ts
const value = useSyncExternalStore(subscribe, getSnapshot)
```

- `subscribe(onChange)` starts listening and returns an unsubscribe function, like an effect cleanup. Call `onChange` whenever the store *might* have changed.
- `getSnapshot()` returns the current value. React calls it every render and after each `onChange`, re-rendering if it differs (by `Object.is`).

It's the observer pattern with a pull: the store says "something changed", and React pulls the value.

"Sync" is about *concurrent rendering*. For some updates ([Chapter 16](16-rendering-and-performance.md#usedeferredvalue-keep-typing-fast-while-a-slow-part-catches-up)), React renders in small slices and lets the browser handle input in between. A store that changes between two slices would leave half the components showing the old value and half the new one: *tearing*. `useSyncExternalStore` notices the change and redoes that render in one synchronous pass, so every component shows the same value.

### Media queries from JavaScript

`window.matchMedia(query)` takes any CSS media query, such as `(min-width: 40rem)`, `(prefers-color-scheme: dark)` or `(prefers-reduced-motion: reduce)` (the OS "reduce motion" accessibility setting). It returns a `MediaQueryList` with a boolean `.matches` and a `change` event: a perfect external store.

`examples/ch13/use-media-query.ts`

```ts
import { useSyncExternalStore } from 'react'

/** true while the CSS media query matches. Re-renders the caller when that changes. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    // subscribe: start listening, and return a function that stops listening.
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    // getSnapshot: read the current value. A boolean, so equal values compare equal.
    () => window.matchMedia(query).matches,
  )
}
```

`examples/ch13/media-query.demo.tsx`

```tsx
import { useMediaQuery } from './use-media-query'

export default function MediaQueryDemo() {
  const wide = useMediaQuery('(min-width: 40rem)')
  const dark = useMediaQuery('(prefers-color-scheme: dark)')
  const calm = useMediaQuery('(prefers-reduced-motion: reduce)')

  return (
    <main>
      <h1>Media queries</h1>
      <ul>
        <li>Window: {wide ? 'wide (40rem or more)' : 'narrow'}</li>
        <li>Color scheme: {dark ? 'dark' : 'light'}</li>
        <li>Motion: {calm ? 'reduced' : 'no preference'}</li>
      </ul>
      <p>Resize the window or change your system settings: the list updates by itself.</p>
    </main>
  )
}
```

Open `http://localhost:5173/?demo=ch13/media-query` and resize the window. To fake the settings in Chrome, open the Command Menu (Ctrl+Shift+P, Cmd+Shift+P on macOS), type "Rendering", and use "Emulate CSS media feature prefers-color-scheme".

Two details:

- The inline `subscribe` is a new function each render, so React unsubscribes and resubscribes after every render. That's cheap for `matchMedia` and lets it use `query`. A `subscribe` that needs no argument belongs at module level, as in `useLocalStorage` below.
- The optional third argument, `getServerSnapshot`, is for server rendering, where there's no `window`; this course renders only in the browser ([Chapter 20](20-where-next.md)).

### Testing it with a fake store

jsdom, the fake browser tests run in, has no `matchMedia`, so the test installs a fake it controls and fires `change` like a browser:

`examples/ch13/use-media-query.test.tsx`

```tsx
import { act, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import MediaQueryDemo from './media-query.demo'

// jsdom has no matchMedia, so we install a fake one that the test controls.
function fakeMatchMedia() {
  const matches = new Map<string, boolean>()
  const listeners = new Map<string, Set<() => void>>()
  const listenersFor = (query: string) => listeners.get(query) ?? listeners.set(query, new Set()).get(query)!

  window.matchMedia = (query: string) =>
    ({
      media: query,
      matches: matches.get(query) ?? false,
      addEventListener: (_type: string, listener: () => void) => listenersFor(query).add(listener),
      removeEventListener: (_type: string, listener: () => void) => listenersFor(query).delete(listener),
    }) as unknown as MediaQueryList

  // Change a query's result and fire 'change', like the browser does.
  return (query: string, value: boolean) => {
    matches.set(query, value)
    for (const listener of listenersFor(query)) listener()
  }
}

it('re-renders when a media query starts or stops matching', () => {
  const setMatch = fakeMatchMedia()
  render(<MediaQueryDemo />)
  expect(screen.getByText(/^Window:/)).toHaveTextContent('Window: narrow')

  // The store changed outside React: React re-reads the snapshot and re-renders.
  act(() => setMatch('(min-width: 40rem)', true))
  expect(screen.getByText(/^Window:/)).toHaveTextContent('Window: wide (40rem or more)')

  act(() => setMatch('(prefers-color-scheme: dark)', true))
  expect(screen.getByText(/^Color scheme:/)).toHaveTextContent('Color scheme: dark')
})
```

```console
$ npx vitest run ch13
 ✓ ch13/use-media-query.test.tsx (1 test) 27ms
 ✓ ch13/use-counter.test.tsx (2 tests) 138ms

 Test Files  2 passed (2)
      Tests  3 passed (3)
```

The listener calls happen outside any user event, so the test wraps them in `act()`.

### Gotcha: `getSnapshot` must return the same value when nothing changed

`Object.is` compares booleans, numbers and strings by value, so `matches` is safe. Objects and arrays compare by *identity*, so a snapshot that builds a new object each call always looks "changed":

```tsx
function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

export default function Names() {
  // 🔴 JSON.parse makes a new array every call
  const names = useSyncExternalStore(subscribe, () => JSON.parse(localStorage.getItem('names') ?? '[]') as string[])
  return <p>{names.join(', ')}</p>
}
```

React warns, then gives up:

```text
The result of getSnapshot should be cached to avoid an infinite loop

Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
```

The fix: return something that compares by value (the raw string from `localStorage`) and parse it in render, or cache the parsed object until the string changes. The project does the first.

## Building five-dice: hooks and a high-score table

The components mix "what to show" with plumbing: context null checks, a title effect, a keyboard listener, a `matchMedia` call. In this step you:

- move each piece of plumbing into a Hook in a new `src/hooks/` folder (one Hook per file, `useX.ts`);
- add `useLocalStorage`, a `useState` that lives in `localStorage`;
- build a top-10 **High scores** table on it, shown on the setup screen and at game over.

The game plays as before, and Chapter 12's 73 tests still pass.

### `useGameState` and `useGameDispatch`

Five components start the same way: read a context, check for `null`, throw. Move that into two Hooks:

`src/hooks/useGame.ts`

```ts
import { useContext } from 'react'
import { GameDispatchContext, GameStateContext } from '../components/contexts'

/** The current game. Throws if used outside <GameProvider>, so callers never see null. */
export function useGameState() {
  const state = useContext(GameStateContext)
  if (!state) throw new Error('useGameState must be used inside <GameProvider>')
  return state
}

/** The game's dispatch function. Throws if used outside <GameProvider>. */
export function useGameDispatch() {
  const dispatch = useContext(GameDispatchContext)
  if (!dispatch) throw new Error('useGameDispatch must be used inside <GameProvider>')
  return dispatch
}
```

After the `if`, TypeScript narrows `state` to `GameState` ([TypeScript Crash Course, chapter 5](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/05-unions-and-narrowing.md#control-flow-analysis)), the inferred return type, so callers never see `null`. Use them in `GameOver`, `Scoreboard` and `Scorecard`. In each file:

- delete `import { useContext } from 'react'`;
- replace `import { GameStateContext } from './contexts'` with `import { useGameState } from '../hooks/useGame'`;
- replace the two lines that read the context and throw with one line.

The top of `Scoreboard.tsx` becomes:

```tsx
import { getPhase } from '../game/reducer'
import { rankPlayers } from '../game/scoring'
import { useGameState } from '../hooks/useGame'

/** Live standings, best first. */
export function Scoreboard() {
  const state = useGameState()

  // Nobody's turn once the game is over.
  const current = getPhase(state) === 'gameOver' ? null : state.players[state.current].name
```

`GameOver` and `Scorecard` get the same `const state = useGameState()`. `Game` and `DiceTray` also need `useGameDispatch()`; both appear in full below.

### `useDocumentTitle`

The title effect from [Chapter 11](11-effects.md) moves out of `Game` unchanged:

`src/hooks/useDocumentTitle.ts`

```ts
import { useEffect } from 'react'

/** Show `title` in the browser tab while the calling component is mounted. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title
    return () => {
      document.title = 'Five Dice'
    }
  }, [title])
}
```

React 19 has a built-in alternative: render `<title>` anywhere in a component, and React moves it into `<head>`, ahead of `index.html`'s `<title>`, so it wins; on unmount React removes it and the static title shows again. Give it one string, `<title>{`${name} · Five Dice`}</title>`: with mixed children such as `<title>{name} · Five Dice</title>`, React 19.3 renders an empty title. The project keeps the Hook, which shows how a custom Hook wraps an Effect.

### `useKeyboardShortcuts`

`DiceTray`'s keyboard effect did two jobs: listening on the window, and knowing what Space and 1–5 do. The Hook keeps the listening and takes the "what" as a map from key to function:

`src/hooks/useKeyboardShortcuts.ts`

```ts
import { useEffect, useEffectEvent } from 'react'

/** Maps a key (as in KeyboardEvent.key, but "Space" for " ") to what it does. */
export type Shortcuts = Record<string, () => void>

/**
 * Run `shortcuts[key]` when that key is pressed anywhere on the page,
 * except while typing in a form field.
 */
export function useKeyboardShortcuts(shortcuts: Shortcuts): void {
  // Always sees the latest `shortcuts` without re-subscribing.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target
    if (target instanceof Element && target.closest('input, select, textarea')) return

    const key = event.key === ' ' ? 'Space' : event.key
    const action = shortcuts[key]
    if (!action) return
    // Space on a focused button already clicks that button.
    if (key === 'Space' && target instanceof HTMLButtonElement) return
    event.preventDefault() // e.g. stop Space from scrolling the page
    action()
  })

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
```

A new `shortcuts` object each render is fine: the Effect Event ([Chapter 11](11-effects.md)) reads the latest, and the listener is added once.

### `useMediaQuery` and `usePrefersReducedMotion`

[Chapter 12](12-refs-and-the-dom.md) read `window.matchMedia('(prefers-reduced-motion: reduce)').matches` once in the roll handler. The concept section's Hook makes it a value React keeps current, and a second Hook names it:

`src/hooks/useMediaQuery.ts`

```ts
import { useSyncExternalStore } from 'react'

/** true while the CSS media query matches; re-renders when that changes. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

/** The operating system's "reduce motion" accessibility setting. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
```

A custom Hook that only calls another custom Hook, like `usePrefersReducedMotion`, is fine and common. `DiceTray` only reads the value in its roll handler, so Chapter 12's direct `matchMedia(…).matches` read was already correct there: a handler reads the setting when it runs and is never stale. The Hook subscribes and re-renders `DiceTray` when the setting changes, which only matters when the *rendered output* depends on it, as in the demo above. Here it buys a name and one place to change the query. Tests need nothing new: since Chapter 12, `src/test/setup.ts` stubs `window.matchMedia` (always `matches: false`, with a no-op `addEventListener`).

### The new `DiceTray`

`DiceTray` now uses all three Hooks. Changes in `src/components/DiceTray.tsx`:

```diff
-import { useContext, useEffect, useEffectEvent, useRef, type Ref } from 'react'
+import { useContext, useRef, type Ref } from 'react'
 import { rollDice } from '../game/dice'
 import { getPhase, type Phase } from '../game/reducer'
 import type { Die as DieModel } from '../game/types'
+import { useGameDispatch, useGameState } from '../hooks/useGame'
+import { useKeyboardShortcuts, type Shortcuts } from '../hooks/useKeyboardShortcuts'
+import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
 import { Die } from './Die'
-import { GameDispatchContext, GameStateContext, RngContext } from './contexts'
+import { RngContext } from './contexts'
 
 const HINTS: Record<Phase, string> = {
@@
 
 export function DiceTray({ rollButtonRef }: DiceTrayProps) {
-  const state = useContext(GameStateContext)
-  const dispatch = useContext(GameDispatchContext)
+  const state = useGameState()
+  const dispatch = useGameDispatch()
   const rng = useContext(RngContext)
-  if (!state || !dispatch) throw new Error('DiceTray must be used inside <GameProvider>')
+  const reducedMotion = usePrefersReducedMotion()
 
   const phase = getPhase(state)
   const canRoll = phase === 'ready' || phase === 'rolling'
 
-  // An arrow function, not `function roll()`: TypeScript keeps the null check
-  // on `dispatch` above for arrow functions, but not for hoisted declarations.
-  const roll = () => {
+  function roll() {
     dispatch({ type: 'roll', values: rollDice(rng) })
     animateRoll(state.dice)
@@
   function animateRoll(dice: readonly DieModel[]) {
     // Respect the user's "reduce motion" setting.
-    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
+    if (reducedMotion) return
     for (const die of dice) {
       if (die.held) continue
@@
   }
 
-  // An Effect Event: called from the Effect below, but always sees the
-  // latest render's values (phase, canRoll, …) without being a dependency.
-  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
-    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
-    // Leave typing in form fields alone.
-    if (event.target instanceof Element && event.target.closest('input, select, textarea')) return
-
-    if (event.key === ' ') {
-      // Space on a focused button already clicks that button.
-      if (event.target instanceof HTMLButtonElement) return
-      event.preventDefault() // don't scroll the page
-      if (canRoll) roll()
-    } else if (['1', '2', '3', '4', '5'].includes(event.key) && phase === 'rolling') {
-      dispatch({ type: 'toggleHold', id: Number(event.key) - 1 })
-    }
-  })
+  function toggleHold(id: number) {
+    if (phase === 'rolling') dispatch({ type: 'toggleHold', id })
+  }
 
-  // Subscribe once on mount, unsubscribe on unmount (and in between when
-  // Strict Mode mounts twice in development).
-  useEffect(() => {
-    window.addEventListener('keydown', onKeyDown)
-    return () => window.removeEventListener('keydown', onKeyDown)
-  }, [])
+  // Space rolls; keys 1–5 hold the matching die.
+  const shortcuts: Shortcuts = {
+    Space: () => {
+      if (canRoll) roll()
+    },
+  }
+  for (const die of state.dice) {
+    shortcuts[String(die.id + 1)] = () => toggleHold(die.id)
+  }
+  useKeyboardShortcuts(shortcuts)
 
   return (
@@
             held={die.held}
             disabled={phase !== 'rolling'}
-            onToggle={() => dispatch({ type: 'toggleHold', id: die.id })}
+            onToggle={() => toggleHold(die.id)}
             // A ref callback: React calls it with the node after mounting,
             // and calls the returned cleanup function before removing it.
```

Notes on the changes:

- `roll` is a `function` declaration again. Chapter 12 needed an arrow function because TypeScript drops the narrowing (`dispatch` not null) in hoisted function declarations ([TypeScript Crash Course, chapter 5](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/05-unions-and-narrowing.md#narrowing-and-callbacks)); `useGameDispatch()` never returns `null`.
- `toggleHold` checks the phase once, for clicks and the 1–5 keys.
- `useKeyboardShortcuts(shortcuts)` follows a `for` loop, which is fine: the loop builds a plain object, and the call stays unconditional and top-level.

### `useLocalStorage`: state that lives in `localStorage`

[Chapter 11](11-effects.md) saved the game with `localStorage.setItem` and read it once at startup. The high-score table needs more:

- Two components use it at once, the game-over "High scores" panel and `Game` (which writes results), and both must see every change. A `useState` inside the Hook would give each a stale copy.
- It should sync across tabs.

So `localStorage` itself is the single source of truth, read with `useSyncExternalStore`:

`src/hooks/useLocalStorage.ts`

```ts
import { useSyncExternalStore } from 'react'

// Components using this hook in this tab. localStorage has no "changed" event
// for the tab that made the change, so we notify them ourselves.
const listeners = new Set<() => void>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  // The `storage` event fires when *another* tab changes localStorage.
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

/**
 * Like useState, but the value lives in localStorage: it survives reloads and
 * stays in sync across every component (and tab) that uses the same key.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // The snapshot is the raw string: strings compare by value, so React only
  // re-renders when the stored text actually changes.
  const json = useSyncExternalStore(subscribe, () => localStorage.getItem(key))

  let value = initialValue
  if (json !== null) {
    try {
      value = JSON.parse(json) as T
    } catch {
      // Corrupt data: fall back to the initial value.
    }
  }

  function setValue(next: T) {
    localStorage.setItem(key, JSON.stringify(next))
    for (const listener of listeners) listener()
  }

  return [value, setValue]
}
```

How it works:

- **The `storage` event** fires on `window` in *other* same-origin tabs and windows when one changes `localStorage`, never in the tab that made the change. So the module calls its own `listeners` set from `setValue`. That set, shared by every component in the tab, is the external store.
- **`subscribe` is declared once at module level.** It doesn't need `key`, so React subscribes once per component, not per render.
- **The snapshot is the raw string** from `getItem` (or `null`), which compares by value, avoiding the gotcha's loop. `JSON.parse` runs afterwards, in render. That makes a new object each render: fine for display, but keep it out of effect dependency arrays.
- **Corrupt data** (edited in devtools, an old format) falls back to `initialValue`, not a crash.
- **Many keys, one listener set.** Any change notifies every subscriber; each re-reads its own key, and React skips the re-render if that string is unchanged.

Test it with `renderHook`:

`src/hooks/useLocalStorage.test.ts`

```ts
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  it('starts with the initial value and persists updates', () => {
    // renderHook renders a tiny test component that calls the hook.
    const { result } = renderHook(() => useLocalStorage('count', 0))
    expect(result.current[0]).toBe(0)

    // act() applies the state update and re-renders before we look.
    act(() => result.current[1](5))
    expect(result.current[0]).toBe(5)
    expect(localStorage.getItem('count')).toBe('5')
  })

  it('keeps every user of the same key in sync', () => {
    const first = renderHook(() => useLocalStorage('name', 'Ada'))
    const second = renderHook(() => useLocalStorage('name', 'Ada'))
    act(() => first.result.current[1]('Bo'))
    expect(second.result.current[0]).toBe('Bo')
  })

  it('falls back to the initial value when stored data is corrupt', () => {
    localStorage.setItem('broken', '{oops')
    const { result } = renderHook(() => useLocalStorage('broken', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })
})
```

A `useState`-based Hook would fail the second test. Since Chapter 11, `setup.ts` clears `localStorage` after each test, so tests can't leak into each other.

### The high-score table

The table logic is pure, so it goes in `src/game/` with the other rules:

`src/game/highScores.ts`

```ts
export interface HighScore {
  name: string
  score: number
  /** When the game ended, as YYYY-MM-DD. */
  date: string
}

export const MAX_HIGH_SCORES = 10

/** Add new results to the table: best first, at most MAX_HIGH_SCORES entries. */
export function addHighScores(table: readonly HighScore[], entries: readonly HighScore[]): HighScore[] {
  // toSorted is stable: an older entry stays above a newer one with the same score.
  return [...table, ...entries].toSorted((a, b) => b.score - a.score).slice(0, MAX_HIGH_SCORES)
}
```

`src/game/highScores.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { addHighScores, MAX_HIGH_SCORES, type HighScore } from './highScores'

const entry = (name: string, score: number): HighScore => ({ name, score, date: '2026-01-01' })

describe('addHighScores', () => {
  it('sorts best first and keeps older entries above equal new ones', () => {
    const table = [entry('Ada', 200), entry('Bo', 150)]
    expect(addHighScores(table, [entry('Cy', 150), entry('Di', 300)]).map((e) => e.name)).toEqual([
      'Di',
      'Ada',
      'Bo',
      'Cy',
    ])
  })

  it(`keeps only the top ${MAX_HIGH_SCORES}`, () => {
    const table = Array.from({ length: MAX_HIGH_SCORES }, (_, i) => entry(`P${i}`, 100 + i))
    const result = addHighScores(table, [entry('Low', 1), entry('High', 999)])
    expect(result).toHaveLength(MAX_HIGH_SCORES)
    expect(result[0].name).toBe('High')
    expect(result.some((e) => e.name === 'Low')).toBe(false)
  })
})
```

A Hook ties the pure function to storage (custom Hooks can call custom Hooks):

`src/hooks/useHighScores.ts`

```ts
import { addHighScores, type HighScore } from '../game/highScores'
import { totals } from '../game/scoring'
import type { Player } from '../game/types'
import { useLocalStorage } from './useLocalStorage'

const EMPTY: HighScore[] = []

/** The local high-score table, and a function to add a finished game's results. */
export function useHighScores() {
  // Custom hooks can call other hooks, including your own.
  const [highScores, setHighScores] = useLocalStorage('five-dice:high-scores:v1', EMPTY)

  function recordGame(players: readonly Player[]) {
    const date = new Date().toISOString().slice(0, 10)
    const entries = players.map((player) => ({ name: player.name, score: totals(player.sheet).grand, date }))
    setHighScores(addHighScores(highScores, entries))
  }

  return { highScores, recordGame }
}
```

- The key ends in `:v1`, like the saved game's. If the format changes, a new key keeps old data from being read as new.
- `EMPTY` is a module constant, so "no scores yet" is the same array every render.
- `toISOString().slice(0, 10)` gives the UTC date as `YYYY-MM-DD`.

The component that shows it:

`src/components/HighScores.tsx`

```tsx
import { useHighScores } from '../hooks/useHighScores'

export function HighScores() {
  const { highScores } = useHighScores()

  if (highScores.length === 0) {
    return <p className="hint">No high scores yet. Finish a game to get on the board!</p>
  }

  return (
    <table className="high-scores">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th className="score">Score</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {highScores.map((entry, index) => (
          // Entries have no id, and names and scores can repeat. The table is
          // only ever replaced as a whole, so the position is a fine key here.
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{entry.name}</td>
            <td className="score">{entry.score}</td>
            <td>{entry.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

The early return comes after the only Hook call, so it follows the rules.

### Recording a finished game in `Game`

The result is recorded *because* the last score was clicked, so it belongs in that handler, not an Effect watching for "game over" ([Chapter 11](11-effects.md)). To know whether this click ends the game, `Game` calls the pure reducer to look ahead. Changes in `src/components/Game.tsx`:

```diff
-import { useContext, useEffect, useRef } from 'react'
+import { useRef } from 'react'
 import { flushSync } from 'react-dom'
-import { getPhase } from '../game/reducer'
+import { gameReducer, getPhase, type GameAction } from '../game/reducer'
 import { CATEGORIES } from '../game/rules'
 import type { Category } from '../game/types'
+import { useDocumentTitle } from '../hooks/useDocumentTitle'
+import { useGameDispatch, useGameState } from '../hooks/useGame'
+import { useHighScores } from '../hooks/useHighScores'
 import { DiceTray } from './DiceTray'
 import { GameOver } from './GameOver'
@@
 import { Scoreboard } from './Scoreboard'
 import { Scorecard } from './Scorecard'
-import { GameDispatchContext, GameStateContext } from './contexts'
+import { HighScores } from './HighScores'
 
 interface GameProps {
@@
 /** Lays out the board. The pieces read the game from context themselves. */
 export function Game({ onPlayAgain }: GameProps) {
-  const state = useContext(GameStateContext)
-  const dispatch = useContext(GameDispatchContext)
-  if (!state || !dispatch) throw new Error('Game must be used inside <GameProvider>')
+  const state = useGameState()
+  const dispatch = useGameDispatch()
+  const { recordGame } = useHighScores()
 
   // Filled in by React with the Roll button's DOM node (null until then).
@@
       ? 'Game over · Five Dice'
       : `${player.name} · turn ${turn}/${CATEGORIES.length} · Five Dice`
+  useDocumentTitle(title)
 
-  // The browser tab's title lives outside React: synchronise it with an Effect.
-  useEffect(() => {
-    document.title = title
-    // Cleanup runs before the next sync and when Game unmounts.
-    return () => {
-      document.title = 'Five Dice'
+  function handleScore(category: Category) {
+    const action: GameAction = { type: 'score', category }
+    // Does this score end the game? The reducer is a pure function, so we can
+    // simply call it to look ahead. Recording the result belongs to this
+    // event, so it happens here, not in an Effect.
+    const next = gameReducer(state, action)
+    if (getPhase(next) === 'gameOver' && next !== state) {
+      recordGame(next.players)
     }
-  }, [title])
 
-  const handleScore = (category: Category) => {
     // The score button we clicked is about to disappear, which would drop
     // keyboard focus to <body>. Move it to the Roll button instead. flushSync
     // applies the update right now, so the button is already enabled again
     // (it was disabled with no rolls left) when we call focus().
-    flushSync(() => dispatch({ type: 'score', category }))
+    flushSync(() => dispatch(action))
     rollButtonRef.current?.focus()
   }
@@
           <Scoreboard />
         </Panel>
+        {phase === 'gameOver' && (
+          <Panel title="High scores">
+            <HighScores />
+          </Panel>
+        )}
       </div>
 
```

- `next !== state`: the reducer returns the *same* object for an ignored action (a disallowed score), so only a real game-ending score is recorded.
- The `useEffect` and `useContext` checks are gone; `Game` reads as a list of what it uses: game, dispatch, high scores, a ref, a title.

### The setup screen and the styles

In `src/App.tsx`, import the table and show it under the form:

```tsx
import { HighScores } from './components/HighScores'
```

```tsx
        <main className="setup">
          <h2>New game</h2>
          <NewGameForm onStart={(setup) => setSession({ id: 1, setup })} />
          <h2>High scores</h2>
          <HighScores />
        </main>
```

In `src/index.css`, the high-score table reuses the scorecard's table styles, and the setup screen gets spacing between its parts. Change these rules:

```css
/* ---------- 5. Scorecard ---------- */
.scorecard,
.high-scores {
  width: 100%;
  border-collapse: collapse;
}

.scorecard th,
.scorecard td,
.high-scores th,
.high-scores td {
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.high-scores .score,
.scorecard .score {
  width: 5rem;
  text-align: right;
}
```

```css
/* ---------- 7. New game form ---------- */
.setup {
  max-width: 32rem;
  display: grid;
  gap: var(--space-3);
}
```

Last, the full-game test in `src/App.test.tsx` checks that the result reached the table. Add the last `expect` before "Play again":

```tsx
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
    // The result went into the high-score table (rank, name, score, date).
    expect(screen.getByRole('row', { name: /^1 Player 1 270 \d{4}-\d\d-\d\d$/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Play again' }))
```

A table row's accessible name is its cells' text joined with spaces. The date changes daily, so a regular expression matches its shape.

### Checkpoint

```console
$ npm test
...
 ✓ src/hooks/useLocalStorage.test.ts (3 tests) 23ms
 ✓ src/game/highScores.test.ts (2 tests) 4ms
...
 ✓ src/App.test.tsx (14 tests) 3675ms
...
 Test Files  10 passed (10)
      Tests  78 passed (78)

$ npm run build
...
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-DPHc3JAM.css    3.38 kB │ gzip:  1.05 kB
dist/assets/index-BQK39O6T.js   233.44 kB │ gzip: 73.30 kB

$ npm run lint
...
Found 0 warnings and 0 errors.
```

Timings, test file order and file-name hashes vary.

In the browser (`npm run dev`):

- The setup screen shows **High scores** with "No high scores yet. Finish a game to get on the board!"
- After a game, a **High scores** panel under Standings shows each player's rank, name, score and today's date.
- **New game** lists the same scores on the setup screen; they survive a reload.
- With two tabs open, finishing a game in one updates the other's setup screen (the `storage` event).
- Rolling, holding, shortcuts, the tab title, saving and resuming work as before.

The complete project at this point is in `project/ch13/`.

## Summary

- A custom Hook is a `use…` function that calls Hooks. Calls share logic, not state; to share data, lift state, use context, or read an external store.
- Rules of Hooks: call Hooks unconditionally, at the top level of components and custom Hooks. React matches them by call order. Oxlint's `rules-of-hooks` catches most slips.
- Extract Hooks that name a purpose or remove repetition. Test them with `renderHook`, `act()` and a fresh `result.current`.
- `useSyncExternalStore(subscribe, getSnapshot)` reads external stores. Snapshots must stay `Object.is`-equal while nothing changes: primitives or cached objects.
- `matchMedia` answers media queries in JavaScript. The `storage` event reaches only *other* tabs; your own tab must notify itself.
- Record results in the event that causes them; a pure reducer lets you look ahead.

## Exercises

1. **`useOnlineStatus`.** Write `useOnlineStatus(): boolean` in `use-online-status.ts`: `true` while `navigator.onLine` is true, updated on the window's `online` and `offline` events. Test it with `renderHook`. Hint: `vi.spyOn(navigator, 'onLine', 'get')` lets a test choose the value.

   <details><summary>Solution</summary>

   `use-online-status.ts`

   ```ts
   import { useSyncExternalStore } from 'react'

   function subscribe(onChange: () => void) {
     window.addEventListener('online', onChange)
     window.addEventListener('offline', onChange)
     return () => {
       window.removeEventListener('online', onChange)
       window.removeEventListener('offline', onChange)
     }
   }

   /** true while the browser thinks it has a network connection. */
   export function useOnlineStatus(): boolean {
     return useSyncExternalStore(subscribe, () => navigator.onLine)
   }
   ```

   `use-online-status.test.ts`

   ```ts
   import { act, renderHook } from '@testing-library/react'
   import { expect, it, vi } from 'vitest'
   import { useOnlineStatus } from './use-online-status'

   it('follows the online and offline events', () => {
     const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
     const { result } = renderHook(() => useOnlineStatus())
     expect(result.current).toBe(true)

     onLine.mockReturnValue(false)
     act(() => {
       window.dispatchEvent(new Event('offline'))
     })
     expect(result.current).toBe(false)
   })
   ```

   `subscribe` takes no arguments, so it lives at module level and React subscribes once. A boolean snapshot is safe to compare.

   </details>

2. **A Hook behind an `if`.** This component shows the score in the tab title only while a box is checked. Oxlint rejects it, and ticking the box throws "Rendered more hooks than during the previous render". Fix it by letting `useDocumentTitle` (from this chapter's project) accept `null`, meaning "leave the title alone".

   ```tsx
   function Score({ points }: { points: number }) {
     const [inTab, setInTab] = useState(false)
     // 🔴 Only show the score in the tab title while the box is checked
     if (inTab) useDocumentTitle(`${points} points`)
     return (
       <label>
         <input type="checkbox" checked={inTab} onChange={(e) => setInTab(e.target.checked)} /> Show {points} points
         in the tab title
       </label>
     )
   }
   ```

   <details><summary>Solution</summary>

   The condition moves inside the Hook, as [the fix above](#what-the-linter-and-react-say) says:

   ```ts
   /** Show `title` in the tab while mounted; `null` leaves the title alone. */
   export function useDocumentTitle(title: string | null): void {
     useEffect(() => {
       if (title === null) return
       document.title = title
       return () => {
         document.title = 'Five Dice'
       }
     }, [title])
   }
   ```

   ```tsx
     // The condition moves into the argument; the call itself is unconditional.
     useDocumentTitle(inTab ? `${points} points` : null)
   ```

   Oxlint reports no errors. Ticking the box sets the title to "42 points" (for `points={42}`); unticking runs the cleanup and restores "Five Dice". Existing callers that pass a string are unaffected.

   </details>

3. **Updater functions.** `useState`'s setter also accepts a function: `setCount((c) => c + 1)`. Give `useLocalStorage`'s setter the same ability and use it in `useHighScores.recordGame`. Add a test that calls the setter twice with `(n) => n + 1` in one `act()` and expects `2`.

   <details><summary>Solution</summary>

   In `src/hooks/useLocalStorage.ts`, replace `useLocalStorage` and add a `parse` helper below it:

   ```ts
   export function useLocalStorage<T>(
     key: string,
     initialValue: T,
   ): [T, (next: T | ((previous: T) => T)) => void] {
     const json = useSyncExternalStore(subscribe, () => localStorage.getItem(key))
     const value = parse(json, initialValue)

     function setValue(next: T | ((previous: T) => T)) {
       // Read the stored value now, not `value` from the last render: a second
       // update in the same event must see the first one.
       const previous = parse(localStorage.getItem(key), initialValue)
       const resolved = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next
       localStorage.setItem(key, JSON.stringify(resolved))
       for (const listener of listeners) listener()
     }

     return [value, setValue]
   }

   function parse<T>(json: string | null, fallback: T): T {
     if (json === null) return fallback
     try {
       return JSON.parse(json) as T
     } catch {
       return fallback
     }
   }
   ```

   In `useHighScores`:

   ```ts
       setHighScores((table) => addHighScores(table, entries))
   ```

   Add to `useLocalStorage.test.ts`, inside the `describe`:

   ```ts
     it('accepts an updater function', () => {
       const { result } = renderHook(() => useLocalStorage('count', 0))
       act(() => {
         result.current[1]((n) => n + 1)
         result.current[1]((n) => n + 1)
       })
       expect(result.current[0]).toBe(2)
     })
   ```

   Reading `value` instead of the stored string would give `1`: both calls would see the last render's `0`. The cast is needed because `T` could itself be a function type, the same ambiguity that stops you storing a function in `useState` directly. `npm test` now reports 79 tests.

   </details>

4. **Clear the table.** Add a "Clear high scores" button under the table, shown only when it has entries. Add `clearHighScores` to `useHighScores`, and write `src/components/HighScores.test.tsx`: put one entry in `localStorage`, render `<HighScores />`, click the button, and expect the "No high scores yet" text.

   <details><summary>Solution</summary>

   In `useHighScores`, before the `return`:

   ```ts
     function clearHighScores() {
       setHighScores(EMPTY)
     }

     return { highScores, recordGame, clearHighScores }
   ```

   In `HighScores`, take `clearHighScores` from the Hook and wrap the table and the button in a fragment:

   ```tsx
   export function HighScores() {
     const { highScores, clearHighScores } = useHighScores()

     if (highScores.length === 0) {
       return <p className="hint">No high scores yet. Finish a game to get on the board!</p>
     }

     return (
       <>
         <table className="high-scores">
           {/* … unchanged … */}
         </table>
         <button type="button" onClick={clearHighScores}>
           Clear high scores
         </button>
       </>
     )
   }
   ```

   `src/components/HighScores.test.tsx`

   ```tsx
   import { render, screen } from '@testing-library/react'
   import userEvent from '@testing-library/user-event'
   import { expect, it } from 'vitest'
   import { HighScores } from './HighScores'

   it('clears the table', async () => {
     const user = userEvent.setup()
     localStorage.setItem('five-dice:high-scores:v1', JSON.stringify([{ name: 'Ada', score: 250, date: '2026-01-01' }]))
     render(<HighScores />)
     expect(screen.getByRole('row', { name: '1 Ada 250 2026-01-01' })).toBeInTheDocument()

     await user.click(screen.getByRole('button', { name: 'Clear high scores' }))
     expect(screen.queryByRole('table')).not.toBeInTheDocument()
     expect(screen.getByText(/No high scores yet/)).toBeInTheDocument()
   })
   ```

   No provider is needed: `HighScores` reads only `localStorage`. Every user of the key shares the store, so the setup screen and the game-over panel empty together.

   </details>

Sources for this chapter: [REFERENCES.md](REFERENCES.md#chapter-13--custom-hooks)
