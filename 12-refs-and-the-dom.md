# Chapter 12 — Refs and the DOM

React updates the DOM for you, and usually that's enough. But some things have no prop: you can't write `focused={true}` on an input, or `<div animate="shake">`. In vanilla code you'd `document.querySelector()` the node and call `.focus()` or `.animate()` on it. In React that's fragile: a component can render many times on one page, so ids clash, and the node may not exist yet or may have been replaced since. **Refs** give you the node React actually rendered. They also hold any value that should survive re-renders without causing one. This chapter covers `useRef`, refs on your own components, ref callbacks, focus management, animations, `flushSync` and measuring layout. In the project, building on the Effects from [Chapter 11](11-effects.md), the dice tumble when you roll and keyboard focus goes somewhere sensible after each score. [Chapter 13](13-custom-hooks.md) moves this logic into custom Hooks.

## Refs: a box React doesn't watch

`useRef(initial)` returns a plain object, `{ current: initial }`, and the *same* object on every render of that component. You can read and change `ref.current` at will; React doesn't notice, and changing it doesn't re-render.

Compared with state:

| | `useState` | `useRef` |
|---|---|---|
| Survives re-renders | yes | yes |
| Changing it re-renders | yes | no |
| How to change it | call the setter | assign `ref.current` |
| Read during render | yes | no (see the gotcha below) |
| Use for | what the screen shows | what only event handlers and Effects need: timer ids, DOM nodes |

A ref is like an instance field in a class, or a module-level variable that each component instance gets its own copy of: React doesn't watch it.

A stopwatch needs both. The times appear on screen, so they're state. The interval id is only needed to stop the interval, so it's a ref:

`examples/ch12/stopwatch.demo.tsx`

```tsx
import { useRef, useState } from 'react'

export default function Stopwatch() {
  // Shown on screen, so state: changing it must re-render.
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState<number | null>(null)
  // Never shown, only needed to stop the interval, so a ref: no re-render.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function handleStart() {
    setStartedAt(Date.now())
    setNow(Date.now())
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => setNow(Date.now()), 10)
  }

  function handleStop() {
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  const seconds = startedAt !== null && now !== null ? (now - startedAt) / 1000 : 0

  return (
    <main>
      <p>Time: {seconds.toFixed(2)} s</p>
      <button type="button" onClick={handleStart}>
        Start
      </button>{' '}
      <button type="button" onClick={handleStop}>
        Stop
      </button>
    </main>
  )
}
```

- A local `let id` fails: each render runs the function again, so the start click's variable is gone when you click Stop. The ref lives as long as the component.
- `ReturnType<typeof setInterval>` fits both the browser's `number` and Node's timer object ([TypeScript Crash Course, chapter 8](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/08-type-manipulation.md#built-in-utility-types)).
- Unlike Chapter 11's timer, this interval starts in an event handler: a click starts it, not "being on screen". (A complete version would also clear it in an Effect cleanup on unmount.)

`examples/ch12/stopwatch.test.tsx`

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Stopwatch from './stopwatch.demo'

// Fake timers also fake Date.now(), so the times are exact.
beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

it('runs until stopped', () => {
  render(<Stopwatch />)
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  act(() => vi.advanceTimersByTime(1500))
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
  act(() => vi.advanceTimersByTime(1500))
  expect(screen.getByText('Time: 1.50 s')).toBeInTheDocument()
})
```

```console
$ npx vitest run ch12/stopwatch
 ✓ ch12/stopwatch.test.tsx (1 test) 105ms
   ✓ runs until stopped 104ms
```

### Gotcha: reading a ref during render

Changing a ref doesn't re-render, so showing its value gives a stale screen:

`examples/ch12/ref-gotchas.test.tsx` (part)

```tsx
// 🔴 Shows a ref's value: the screen never updates.
function ClickCounter() {
  const clicks = useRef(0)
  return (
    <button type="button" onClick={() => (clicks.current += 1)}>
      {/* oxlint-disable-next-line react/refs -- the bug we are demonstrating */}
      Clicked {clicks.current} times
    </button>
  )
}

it('does not re-render when a ref changes', async () => {
  const user = userEvent.setup()
  render(<ClickCounter />)
  await user.click(screen.getByRole('button'))
  await user.click(screen.getByRole('button'))
  expect(screen.getByRole('button')).toHaveTextContent('Clicked 0 times')
})
```

`clicks.current` is 2, but the button says 0 until something else re-renders it. Without the disable comment, Oxlint flags it:

```console
$ npx oxlint ch12/ref-gotchas.test.tsx
  ⚠ react(refs): Cannot access refs during render
    ╭─[ch12/ref-gotchas.test.tsx:11:16]
 10 │     <button type="button" onClick={() => (clicks.current += 1)}>
 11 │       Clicked {clicks.current} times
    ·                ───────┬──────
    ·                       ╰── Cannot access ref value during render
 12 │     </button>
    ╰────
  help: React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected

Found 1 warning and 0 errors.
```

Read and write refs in event handlers and Effects, never while rendering. If the screen shows it, it's state.

## Refs to DOM nodes

Most refs hold a DOM node. Pass a ref object as a built-in element's `ref` attribute, and React puts the node in `ref.current`:

`examples/ch12/focus.demo.tsx`

```tsx
import { useRef } from 'react'

export default function FocusDemo() {
  // A box React fills in: null now, the <input> element after the commit.
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <main>
      <input ref={inputRef} aria-label="Name" />
      <button type="button" onClick={() => inputRef.current?.focus()}>
        Edit name
      </button>
    </main>
  )
}
```

- `useRef<HTMLInputElement>(null)` has the type `RefObject<HTMLInputElement | null>`. It's `null` during the first render: the node doesn't exist yet.
- React sets `current` when it **commits**: after putting the `<input>` in the DOM, before any Effects run. When the input is removed, React sets it back to `null`.
- By the time anyone can click the button, `current` is the input; the `?.` is for TypeScript and safety.
- `focus()` is a plain DOM method (`HTMLElement.focus()`). The ref gets you the node; the rest is the web platform.

`examples/ch12/focus.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import FocusDemo from './focus.demo'

it('moves focus to the input', async () => {
  const user = userEvent.setup()
  render(<FocusDemo />)
  await user.click(screen.getByRole('button', { name: 'Edit name' }))
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()
})
```

```console
$ npx vitest run ch12/focus
 ✓ ch12/focus.test.tsx (1 test) 120ms
   ✓ moves focus to the input 120ms
```

Use DOM refs for things React has no prop for:

- focus and text selection;
- scrolling (`scrollIntoView`, `scrollTo`);
- measuring (`getBoundingClientRect`);
- animations (`animate`);
- handing a node to non-React code, such as a chart library.

Don't use them to change what React renders: no `innerHTML`, `appendChild`, `remove()`, `classList.toggle()` or `setAttribute()` on nodes React manages. React's picture of the DOM no longer matches the real one, so the next render can undo your change (a class or attribute React sets) or crash (a child it expects to find). Put it in state and let React render it, as [Chapter 2](02-from-vanilla-dom-to-react.md#what-react-changes-about-your-dom-code) mapped out. Calling methods that don't change the DOM tree, like `focus()`, `scrollIntoView()` and `animate()`, is what refs are for.

### Handing a node to non-React code

Charts, maps and rich-text editors are often plain JavaScript libraries: you give them an element, and they build and own the DOM inside it. In vanilla code you'd call `createChart(document.querySelector('#chart'))` once the page has loaded. In React, render an **empty** container, take it with a ref, and create the widget in an Effect ([Chapter 11](11-effects.md)), so it's created when the container appears and destroyed when it goes:

`examples/ch12/widget.demo.tsx`

```tsx
import { useEffect, useRef, useState } from 'react'

// Stands in for a non-React library: it builds and owns DOM inside `container`.
function createBarChart(container: HTMLElement) {
  const bars = document.createElement('div')
  bars.className = 'bars'
  bars.style.cssText = 'display: flex; align-items: end; gap: 4px; height: 60px'
  container.append(bars)
  return {
    update(values: number[]) {
      bars.replaceChildren(
        ...values.map((value) => {
          const bar = document.createElement('div')
          bar.style.cssText = `width: 16px; height: ${value * 10}px; background: steelblue`
          bar.title = String(value)
          return bar
        }),
      )
    },
    destroy() {
      bars.remove()
    },
  }
}

type BarChart = ReturnType<typeof createBarChart>

function DiceChart({ values }: { values: number[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<BarChart | null>(null)

  // Create the widget when the container appears, destroy it when it goes.
  useEffect(() => {
    if (!containerRef.current) return
    const chart = createBarChart(containerRef.current)
    chartRef.current = chart
    return () => {
      chart.destroy()
      chartRef.current = null
    }
  }, [])

  // Hand it new data whenever the props change.
  useEffect(() => {
    chartRef.current?.update(values)
  }, [values])

  // React renders the container empty and never touches what's inside.
  return <div ref={containerRef} className="chart" />
}

const rollDie = () => Math.floor(Math.random() * 6) + 1

export default function WidgetDemo() {
  const [values, setValues] = useState(() => Array.from({ length: 5 }, rollDie))
  const [shown, setShown] = useState(true)

  return (
    <main>
      <button type="button" onClick={() => setValues(values.map(rollDie))}>
        Roll
      </button>{' '}
      <button type="button" onClick={() => setShown(!shown)}>
        {shown ? 'Hide' : 'Show'} chart
      </button>
      {shown && <DiceChart values={values} />}
    </main>
  )
}
```

- `createBarChart` stands in for the library. React never renders children into the container, so the library's DOM and React's never overlap: the rule above holds.
- Two Effects: one creates and destroys the widget (empty dependencies), one passes it new data when `values` changes. Effects run in order, so on mount the chart exists before the first `update`.
- The second ref holds the widget object, not a node: refs hold any value handlers and Effects need.

`examples/ch12/widget.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import WidgetDemo from './widget.demo'

const titles = (container: HTMLElement) =>
  [...container.querySelectorAll('.bars > div')].map((bar) => bar.getAttribute('title'))

it('creates, updates and destroys the widget with the component', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5) // every die shows 4
  const user = userEvent.setup()
  const { container } = render(<WidgetDemo />)
  expect(titles(container)).toEqual(['4', '4', '4', '4', '4'])

  vi.spyOn(Math, 'random').mockReturnValue(0) // every die shows 1
  await user.click(screen.getByRole('button', { name: 'Roll' }))
  expect(titles(container)).toEqual(['1', '1', '1', '1', '1'])

  await user.click(screen.getByRole('button', { name: 'Hide chart' }))
  expect(container.querySelector('.bars')).toBeNull()
})

it('ends up with one widget in Strict Mode', () => {
  const { container } = render(<WidgetDemo />, { reactStrictMode: true })
  // Created, destroyed by the cleanup, created again: still one.
  expect(container.querySelectorAll('.bars')).toHaveLength(1)
  expect(titles(container)).toHaveLength(5)
})
```

```console
$ npx vitest run ch12/widget
 ✓ ch12/widget.test.tsx (2 tests) 133ms
```

Delete `chart.destroy()` and the Strict Mode test fails with two charts in the container: Strict Mode's extra cleanup and setup ([Chapter 11](11-effects.md#strict-mode-runs-setup-twice)) catches the leak before users do. If a library ships a React wrapper component, use that: it does all this for you.

## Passing a ref to your own component

On *your* component, `ref` is just a prop. Since React 19, function components receive it like any other and decide what to do with it, usually pass it on to an element:

`examples/ch12/ref-prop.demo.tsx`

```tsx
import { useImperativeHandle, useRef, type ComponentProps, type Ref } from 'react'

// React 19: `ref` is an ordinary prop. ComponentProps<'input'> already
// includes it, so it arrives with the rest and goes on to the <input>.
function TextField({ label, ...inputProps }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className="field">
      {label} <input {...inputProps} />
    </label>
  )
}

/** The only things a parent may do with a SearchBox. */
export interface SearchBoxHandle {
  focus: () => void
  clear: () => void
}

// useImperativeHandle: expose a small custom object instead of the DOM node.
function SearchBox({ ref }: { ref?: Ref<SearchBoxHandle> }) {
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => {
      if (inputRef.current) inputRef.current.value = ''
    },
  }))
  return <input ref={inputRef} aria-label="Search" defaultValue="dice" />
}

export default function RefPropDemo() {
  const nameRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<SearchBoxHandle>(null)

  return (
    <main>
      <TextField ref={nameRef} label="Name" />
      <button type="button" onClick={() => nameRef.current?.focus()}>
        Focus name
      </button>
      <SearchBox ref={searchRef} />
      <button
        type="button"
        onClick={() => {
          searchRef.current?.clear()
          searchRef.current?.focus()
        }}
      >
        New search
      </button>
    </main>
  )
}
```

- `ComponentProps<'input'>` types every prop `<input>` accepts, `ref` included. `TextField` spreads them onto its input, so the parent's ref lands on the real `<input>`.
- `Ref<T>` types a `ref` prop: a ref object or a ref callback (next section). Make it optional.
- Older code wraps such components in `forwardRef(...)`, because before React 19 `ref` wasn't passed as a prop. You no longer need it.

**`useImperativeHandle(ref, () => handle)`** sets the parent's ref to an object *you* build instead of a DOM node. `SearchBox` exposes only `focus()` and `clear()`, so the parent can't restyle or remove the input behind its back. It's rarely needed: passing the ref on (or using props) is usually simpler.

`examples/ch12/ref-prop.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import RefPropDemo from './ref-prop.demo'

it('passes a ref through a component like any other prop', async () => {
  const user = userEvent.setup()
  render(<RefPropDemo />)
  await user.click(screen.getByRole('button', { name: 'Focus name' }))
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()
})

it('exposes only focus() and clear() through useImperativeHandle', async () => {
  const user = userEvent.setup()
  render(<RefPropDemo />)
  const search = screen.getByRole('textbox', { name: 'Search' })
  expect(search).toHaveValue('dice')
  await user.click(screen.getByRole('button', { name: 'New search' }))
  expect(search).toHaveValue('')
  expect(search).toHaveFocus()
})
```

```console
$ npx vitest run ch12/ref-prop
 ✓ ch12/ref-prop.test.tsx (2 tests) 133ms
   ✓ passes a ref through a component like any other prop 116ms
   ✓ exposes only focus() and clear() through useImperativeHandle 16ms
```

### Gotcha: a component that doesn't take a ref

A component only forwards a ref if it declares and uses one. This `Field` doesn't:

`examples/ch12/ref-gotchas.test.tsx` (part)

```tsx
// 🔴 Accepts no `ref` prop, so a ref passed to it goes nowhere.
function Field({ label }: { label: string }) {
  return (
    <label>
      {label} <input />
    </label>
  )
}

it('leaves the ref empty when the component ignores it', () => {
  const nameRef = createRef<HTMLInputElement>()
  // @ts-expect-error -- Field doesn't declare a ref prop
  render(<Field ref={nameRef} label="Name" />)
  expect(nameRef.current).toBeNull()
})
```

`createRef()` makes a ref object outside a component, handy in tests. Delete the `@ts-expect-error` line and the type check explains:

```console
$ npx tsc -b
ch12/ref-gotchas.test.tsx:36:17 - error TS2322: Type '{ ref: RefObject<HTMLInputElement | null>; label: string; }' is not assignable to type 'IntrinsicAttributes & { label: string; }'.
  Property 'ref' does not exist on type 'IntrinsicAttributes & { label: string; }'.

36   render(<Field ref={nameRef} label="Name" />)
                   ~~~

Found 1 error in ch12/ref-gotchas.test.tsx:36
```

At run time the ref would stay `null`, and `nameRef.current?.focus()` would silently do nothing. The fix: add `ref?: Ref<HTMLInputElement>` to the props and pass it to the `<input>`.

```console
$ npx vitest run ch12/ref-gotchas
 ✓ ch12/ref-gotchas.test.tsx (2 tests) 156ms
   ✓ does not re-render when a ref changes 151ms
   ✓ leaves the ref empty when the component ignores it 4ms
```

## Ref callbacks

A ref object holds one node. For a list of nodes, or to run code when a node appears, pass a **function** as `ref`. React calls this **ref callback** with the node when attaching it. Since React 19 it can return a **cleanup**, which React calls when detaching the node:

`examples/ch12/ref-callback.demo.tsx`

```tsx
import { useRef, useState } from 'react'

const PLAYERS = ['Ada', 'Bo', 'Cy', 'Di', 'Ed', 'Flo', 'Gus', 'Hal']

export default function PlayerList() {
  const [players, setPlayers] = useState(PLAYERS.slice(0, 3))
  // One ref, many nodes: a Map from name to <li>, kept up to date by ref callbacks.
  const nodes = useRef(new Map<string, HTMLLIElement>())

  function highlight(name: string) {
    const node = nodes.current.get(name)
    node?.scrollIntoView({ block: 'nearest' })
    node?.animate([{ background: 'gold' }, { background: 'transparent' }], { duration: 800 })
  }

  return (
    <main>
      <button type="button" onClick={() => setPlayers(PLAYERS.slice(0, players.length + 1))}>
        Add player
      </button>{' '}
      <button type="button" onClick={() => setPlayers(players.slice(1))}>
        Remove first
      </button>{' '}
      <button type="button" onClick={() => highlight(players[players.length - 1])}>
        Highlight last
      </button>
      <ul style={{ maxHeight: '6rem', overflowY: 'auto' }}>
        {players.map((name) => (
          <li
            key={name}
            ref={(node) => {
              // The type allows null, but with a cleanup React never passes it.
              if (!node) return
              // Called with the node after React attaches it…
              console.log(`attach ${name}`)
              nodes.current.set(name, node)
              // …and the returned cleanup runs when React detaches it.
              return () => {
                console.log(`detach ${name}`)
                nodes.current.delete(name)
              }
            }}
          >
            {name}
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- You can't call `useRef` per list item: the number of Hook calls must not change between renders ([Chapter 13](13-custom-hooks.md) explains why). One ref holding a `Map` works for any number.
- Without a cleanup, React calls the callback again with `null` on detach, hence `null` in the parameter type. With a cleanup, React calls that instead, so `node` is never `null` here, but TypeScript can't know.
- **Highlight last** scrolls to the last name and flashes it gold. Neither has a prop: both are DOM methods on the stored node.

The test logs what happens:

`examples/ch12/ref-callback.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import PlayerList from './ref-callback.demo'

/** Returns what was logged since the last call, one string per console.log call. */
function spyOnLog() {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  return () => {
    const lines = log.mock.calls.map((args) => args.join(' '))
    log.mockClear()
    return lines
  }
}

it('calls the ref callback on attach and its cleanup on detach', async () => {
  const logged = spyOnLog()
  const user = userEvent.setup()
  render(<PlayerList />)
  expect(logged()).toEqual(['attach Ada', 'attach Bo', 'attach Cy'])

  // An inline callback is a new function on every render, so React
  // detaches the old one and attaches the new one, for every item.
  await user.click(screen.getByRole('button', { name: 'Add player' }))
  expect(logged()).toEqual([
    'detach Ada',
    'detach Bo',
    'detach Cy',
    'attach Ada',
    'attach Bo',
    'attach Cy',
    'attach Di',
  ])
})

it('runs every ref callback twice on mount in Strict Mode', () => {
  const logged = spyOnLog()
  render(<PlayerList />, { reactStrictMode: true })
  expect(logged()).toEqual([
    'attach Ada',
    'attach Bo',
    'attach Cy',
    'detach Ada',
    'detach Bo',
    'detach Cy',
    'attach Ada',
    'attach Bo',
    'attach Cy',
  ])
})
```

```console
$ npx vitest run ch12/ref-callback
 ✓ ch12/ref-callback.test.tsx (2 tests) 125ms
   ✓ calls the ref callback on attach and its cleanup on detach 120ms
   ✓ runs every ref callback twice on mount in Strict Mode 4ms
```

Two things to notice:

- **An inline callback runs again on every render.** Adding Di re-renders the list. Each `ref={(node) => …}` is a new function, so React treats it as a new ref and runs the old cleanup and new callback for *every* item, not just Di. With a correct cleanup that's harmless: the `Map` ends up right. If the callback does something visible (like moving focus), define it once at module level: then React calls it only when the node really appears or goes away. The project does that below.
- **Strict Mode checks ref callbacks too**, like Effects: attach, detach, attach.

In the browser (`?demo=ch12/ref-callback`, development mode), **Add player** logs one more `detach Di` / `attach Di` pair at the end: Strict Mode double-checks the new item's ref too.

## Focus management

You know `focus()` and `tabIndex`. What React adds is a new way to lose focus: re-rendering can remove the focused element. [Chapter 2](02-from-vanilla-dom-to-react.md#one-render-function-and-why-it-isnt-enough)'s rebuild-everything roller lost focus on every click; React keeps nodes it can reuse, so that doesn't happen by accident, but a button that disappears because state changed (a score button once used, a "Start" button whose screen is gone) still takes the focus with it. Focus falls back to `<body>`, a screen reader has nothing to announce, and where the next Tab lands depends on the browser.

So after an action that removes or replaces the focused element, decide where focus goes, usually where the user goes next or onto the result:

- Call `focus()` on a ref, in the event handler that made the change.
- `tabIndex={-1}` makes a heading or paragraph focusable from code without adding a Tab stop.
- For focus on first appearance, `autoFocus` works on `<input>`, `<button>`, `<select>` and `<textarea>`. React doesn't write the HTML attribute; it calls `focus()` itself when it inserts the element, so it also works for elements added after page load. On anything else, a `<p tabIndex={-1}>` for example, React drops it silently; use a ref, as `GameOver` does below.

Don't move focus without a reason: unexpected jumps confuse as much as lost focus. [Chapter 15](15-accessibility.md) covers accessibility in depth.

## Animations with the Web Animations API

CSS animates with `@keyframes` and a class, but only when the element appears or gets the class; replaying means removing the class and adding it again. For "play this *now*, in response to an event", the browser's **Web Animations API** is simpler:

```ts
element.animate(keyframes, options) // returns an Animation object
```

- `keyframes` is an array of style objects, like the steps of a CSS `@keyframes` rule.
- `options` holds `duration` (milliseconds), `easing`, `iterations` and so on.
- It runs on top of the element's styles and leaves no trace when it ends, so it doesn't fight React's styles.

Some people get dizzy or sick from on-screen motion and turn on **reduce motion** in their operating system. CSS reads that setting with the media query `prefers-reduced-motion`; JavaScript reads any media query with `window.matchMedia(query).matches`.

`examples/ch12/shake.demo.tsx`

```tsx
import { useRef, useState, type FormEvent } from 'react'

const SHAKE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-8px)' },
  { transform: 'translateX(8px)' },
  { transform: 'translateX(-8px)' },
  { transform: 'translateX(0)' },
]

export default function ShakeDemo() {
  const [greeting, setGreeting] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = inputRef.current
    if (!input) return
    if (input.value.trim() === '') {
      input.focus()
      // Respect the user's "reduce motion" setting.
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        input.animate(SHAKE, { duration: 300, easing: 'ease-in-out' })
      }
      return
    }
    setGreeting(`Hello, ${input.value}!`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name <input ref={inputRef} />
      </label>{' '}
      <button type="submit">Join</button>
      <p>{greeting}</p>
    </form>
  )
}
```

Click **Join** with an empty name (`?demo=ch12/shake`): the field shakes and gets focus. Type `Ada` and press Enter: `Hello, Ada!`. The input is uncontrolled ([Chapter 9](09-forms.md)); the handler reads its value through the ref.

jsdom lacks `animate` and `matchMedia`, so the test mocks them:

`examples/ch12/shake.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import ShakeDemo from './shake.demo'

// jsdom has neither animations nor media queries: stub the two the demo uses.
Element.prototype.animate = vi.fn()
window.matchMedia = vi.fn().mockReturnValue({ matches: false })

it('shakes and focuses an empty name', async () => {
  const user = userEvent.setup()
  render(<ShakeDemo />)
  await user.click(screen.getByRole('button', { name: 'Join' }))

  const input = screen.getByRole('textbox', { name: 'Name' })
  expect(input).toHaveFocus()
  expect(Element.prototype.animate).toHaveBeenCalledOnce()
  expect(vi.mocked(Element.prototype.animate).mock.contexts[0]).toBe(input)
})

it('greets a real name without shaking', async () => {
  const user = userEvent.setup()
  render(<ShakeDemo />)
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada{Enter}')

  expect(screen.getByText('Hello, Ada!')).toBeInTheDocument()
  expect(Element.prototype.animate).not.toHaveBeenCalled()
})
```

- Assigning `Element.prototype.animate` gives *every* element the mock, since all elements inherit from `Element.prototype`.
- `mock.contexts[0]` is the first call's `this`: the element whose `animate` was called.
- `vi.mocked(x)` does nothing at run time; it tells TypeScript `x` is a mock, so `.mock` type-checks.
- The second test relies on Vitest clearing recorded calls before each test (`clearMocks`, on by default). Otherwise it would still see the first test's call.

```console
$ npx vitest run ch12/shake
 ✓ ch12/shake.test.tsx (2 tests) 146ms
   ✓ shakes and focuses an empty name 119ms
   ✓ greets a real name without shaking 26ms
```

## `flushSync`: update the DOM right now

State updates are batched: React doesn't touch the DOM until the event handler finishes ([Chapter 5](05-state-and-events.md)). Usually that's what you want, but not when the handler's next line needs the *new* DOM, for example to focus an input the update adds:

`examples/ch12/flush-sync.demo.tsx`

```tsx
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

export function PlayerNames({ sync }: { sync: boolean }) {
  const [names, setNames] = useState(['Ada'])
  const listRef = useRef<HTMLOListElement>(null)

  function handleAdd() {
    const add = () => setNames([...names, ''])
    if (sync) {
      // Apply the update and change the DOM now, before the next line.
      flushSync(add)
    } else {
      add() // only queued: the DOM still has the old list
    }
    listRef.current?.querySelector<HTMLInputElement>('li:last-child input')?.focus()
  }

  return (
    <section>
      <ol ref={listRef}>
        {names.map((name, i) => (
          <li key={i}>
            <input
              aria-label={`Player ${i + 1}`}
              value={name}
              onChange={(event) => setNames(names.map((n, j) => (j === i ? event.target.value : n)))}
            />
          </li>
        ))}
      </ol>
      <button type="button" onClick={handleAdd}>
        Add player {sync ? '(flushSync)' : '(plain)'}
      </button>
    </section>
  )
}

export default function FlushSyncDemo() {
  return (
    <main>
      <PlayerNames sync={false} />
      <PlayerNames sync />
    </main>
  )
}
```

`flushSync(fn)` from `react-dom` runs `fn`, then makes React apply the resulting updates to the DOM before returning. (`key={i}` is fine here, since this list only grows at the end; [Chapter 4](04-components-and-jsx.md) showed when index keys break.)

`examples/ch12/flush-sync.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { PlayerNames } from './flush-sync.demo'

it('focuses the old last input without flushSync', async () => {
  const user = userEvent.setup()
  render(<PlayerNames sync={false} />)
  await user.click(screen.getByRole('button', { name: 'Add player (plain)' }))
  expect(screen.getByRole('textbox', { name: 'Player 1' })).toHaveFocus()
})

it('focuses the new input with flushSync', async () => {
  const user = userEvent.setup()
  render(<PlayerNames sync />)
  await user.click(screen.getByRole('button', { name: 'Add player (flushSync)' }))
  expect(screen.getByRole('textbox', { name: 'Player 2' })).toHaveFocus()
})
```

```console
$ npx vitest run ch12/flush-sync
 ✓ ch12/flush-sync.test.tsx (2 tests) 176ms
   ✓ focuses the old last input without flushSync 155ms
   ✓ focuses the new input with flushSync 20ms
```

Without `flushSync`, the "last" input is still Player 1 when the handler looks. `flushSync` forces a render mid-handler, so it's slower than batching. Use it rarely, for exactly this: DOM work that needs the result of an update you just made.

## Measuring layout: `useLayoutEffect`

`useLayoutEffect` ([Chapter 11](11-effects.md)) runs after React updates the DOM but before the browser paints. With a ref, it can do its real job, measuring:

`examples/ch12/measure.demo.tsx`

```tsx
import { useLayoutEffect, useRef, useState } from 'react'

export default function MeasureDemo() {
  const [text, setText] = useState('Five Dice')
  const [width, setWidth] = useState(0)
  const textRef = useRef<HTMLSpanElement>(null)

  // Runs after React updates the DOM but before the browser paints, so the
  // underline never shows the old width, not even for one frame.
  useLayoutEffect(() => {
    if (textRef.current) setWidth(textRef.current.getBoundingClientRect().width)
  }, [text])

  return (
    <main>
      <label>
        Title <input value={text} onChange={(event) => setText(event.target.value)} />
      </label>
      <h2>
        <span ref={textRef}>{text}</span>
      </h2>
      <div style={{ width, borderBottom: '4px solid tomato' }} />
      <p>Underline: {Math.round(width)} px</p>
    </main>
  )
}
```

- `getBoundingClientRect()` returns the element's laid-out size and position.
- The width depends on the text *and* the font, so only the browser can compute it. That makes layout an external system, so setting state from it in the layout Effect is fine.
- `setWidth` inside `useLayoutEffect` re-renders at once, still before paint, so the user only sees the underline at the right width.

Open `?demo=ch12/measure`. With the default text it shows something like `Underline: 122 px` (depending on your fonts), and the red line grows as you type. There's no test: jsdom has no layout, so every size is 0.

This Effect measures only when `text` changes. The width also changes when a web font finishes loading or the heading wraps in a narrower window, and no React state knows about those. To follow them, watch the node with the browser's `ResizeObserver`: create it in an Effect with the ref's node, call `observe(node)`, and `disconnect()` in the cleanup, the same shape as the widget above.

## Building five-dice: dice animation and focus

In this step you:

- make the unheld dice tumble when you roll (except for users who prefer reduced motion);
- move focus to the **Roll** button after you score, instead of losing it;
- move focus to the result when the game ends.

### `Die`: accept a ref

To animate the dice, `DiceTray` needs each die's `<button>` node. Add a `ref` prop to `Die` and pass it to the button. Changes in `src/components/Die.tsx`:

`src/components/Die.tsx`

```tsx
import type { Ref } from 'react'
import type { DieValue } from '../game/types'
```

```tsx
interface DieProps {
  value: DieValue
  held: boolean
  disabled: boolean
  onToggle: () => void
  /** React 19: `ref` is an ordinary prop for function components (no forwardRef). */
  ref?: Ref<HTMLButtonElement>
}

export function Die({ value, held, disabled, onToggle, ref }: DieProps) {
  return (
    // A real <button>: clickable, focusable and keyboard-operable for free.
    // aria-label and aria-pressed tell screen readers what the pips show
    // and whether the die is held (Chapter 15 covers ARIA).
    <button
      ref={ref}
      type="button"
```

The rest of the file doesn't change.

### `DiceTray`: tumble the dice

Changes in `src/components/DiceTray.tsx`:

```diff
-import { useContext, useEffect, useEffectEvent } from 'react'
+import { useContext, useEffect, useEffectEvent, useRef, type Ref } from 'react'
 import { rollDice } from '../game/dice'
 import { getPhase, type Phase } from '../game/reducer'
+import type { Die as DieModel } from '../game/types'
 import { Die } from './Die'
 import { GameDispatchContext, GameStateContext, RngContext } from './contexts'
@@
 }
 
-export function DiceTray() {
-  // No props: everything comes from context.
+const TUMBLE: Keyframe[] = [
+  { transform: 'rotate(0) scale(1)' },
+  { transform: 'rotate(200deg) scale(0.8)' },
+  { transform: 'rotate(360deg) scale(1)' },
+]
+
+interface DiceTrayProps {
+  /** Lets the parent reach the Roll button, to move focus to it. */
+  rollButtonRef?: Ref<HTMLButtonElement>
+}
+
+export function DiceTray({ rollButtonRef }: DiceTrayProps) {
   const state = useContext(GameStateContext)
   const dispatch = useContext(GameDispatchContext)
@@
   // An arrow function, not `function roll()`: TypeScript keeps the null check
   // on `dispatch` above for arrow functions, but not for hoisted declarations.
-  const roll = () => dispatch({ type: 'roll', values: rollDice(rng) })
+  const roll = () => {
+    dispatch({ type: 'roll', values: rollDice(rng) })
+    animateRoll(state.dice)
+  }
+
+  // A ref holds a value that survives re-renders without causing one.
+  // Here: the DOM node of each die, by die id.
+  const dieNodes = useRef(new Map<number, HTMLButtonElement>())
+
+  function animateRoll(dice: readonly DieModel[]) {
+    // Respect the user's "reduce motion" setting.
+    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
+    for (const die of dice) {
+      if (die.held) continue
+      // The Web Animations API: animate a DOM node directly, outside React.
+      dieNodes.current.get(die.id)?.animate(TUMBLE, { duration: 400, easing: 'ease-out' })
+    }
+  }
 
   // An Effect Event: called from the Effect below, but always sees the
@@
             disabled={phase !== 'rolling'}
             onToggle={() => dispatch({ type: 'toggleHold', id: die.id })}
+            // A ref callback: React calls it with the node after mounting,
+            // and calls the returned cleanup function before removing it.
+            ref={(node) => {
+              if (!node) return
+              dieNodes.current.set(die.id, node)
+              return () => {
+                dieNodes.current.delete(die.id)
+              }
+            }}
           />
         ))}
@@
       <div className="roll-row">
         <button
+          ref={rollButtonRef}
           type="button"
           className="roll-button"
```

- `dieNodes` maps die ids to `<button>` nodes, filled by the ref callback, like the player list above. The inline callback runs on every render, harmlessly: cleanup and the new callback leave the same `Map`.
- `roll` dispatches, then animates. The dice keep their `key` (`die.id`), so React keeps the same five `<button>` nodes and only changes their pips; the animation runs on those nodes meanwhile.
- `animateRoll(state.dice)` reads the dice from the click's render. Rolling doesn't change which dice are held, so that's the right list.
- The animation is in the event handler, not an Effect watching the dice: it happens *because the player rolled* ([Chapter 11](11-effects.md)). An Effect would also tumble the dice when a saved game resumes, and twice in Strict Mode.
- `rollButtonRef` is an ordinary, descriptively named prop, passed to the Roll button's `ref`. A component can take any number of ref props; only `ref` itself gets special syntax.

### `Game`: focus the Roll button after scoring

Clicking a score button turns that cell into a plain number, and the button disappears. Focus falls to `<body>`, and a keyboard player has lost their place: Roll is now somewhere behind them in the Tab order. `Game` fixes that by scoring itself, then moving focus. Changes in `src/components/Game.tsx`:

```diff
-import { useContext, useEffect } from 'react'
+import { useContext, useEffect, useRef } from 'react'
+import { flushSync } from 'react-dom'
 import { getPhase } from '../game/reducer'
 import { CATEGORIES } from '../game/rules'
+import type { Category } from '../game/types'
 import { DiceTray } from './DiceTray'
 import { GameOver } from './GameOver'
@@
 import { Scoreboard } from './Scoreboard'
 import { Scorecard } from './Scorecard'
-import { GameStateContext } from './contexts'
+import { GameDispatchContext, GameStateContext } from './contexts'
 
 interface GameProps {
@@
 export function Game({ onPlayAgain }: GameProps) {
   const state = useContext(GameStateContext)
-  if (!state) throw new Error('Game must be used inside <GameProvider>')
+  const dispatch = useContext(GameDispatchContext)
+  if (!state || !dispatch) throw new Error('Game must be used inside <GameProvider>')
+
+  // Filled in by React with the Roll button's DOM node (null until then).
+  const rollButtonRef = useRef<HTMLButtonElement>(null)
 
   const phase = getPhase(state)
@@
   }, [title])
 
+  const handleScore = (category: Category) => {
+    // The score button we clicked is about to disappear, which would drop
+    // keyboard focus to <body>. Move it to the Roll button instead. flushSync
+    // applies the update right now, so the button is already enabled again
+    // (it was disabled with no rolls left) when we call focus().
+    flushSync(() => dispatch({ type: 'score', category }))
+    rollButtonRef.current?.focus()
+  }
+
   return (
     <main className="board">
       <div className="stack">
         <Panel title={phase === 'gameOver' ? 'Game over' : `${player.name}'s turn`}>
-          {phase === 'gameOver' ? <GameOver onPlayAgain={onPlayAgain} /> : <DiceTray />}
+          {phase === 'gameOver' ? <GameOver onPlayAgain={onPlayAgain} /> : <DiceTray rollButtonRef={rollButtonRef} />}
         </Panel>
         <Panel title="Standings">
@@
 
       <Panel title="Scorecard">
-        <Scorecard />
+        <Scorecard onScore={handleScore} />
       </Panel>
     </main>
```

- `Game` owns `rollButtonRef` and hands it to `DiceTray`, which puts it on the button: a ref crosses a component boundary like any prop.
- `Game` now reads `GameDispatchContext` too; `handleScore` is an arrow function for the same TypeScript reason as `roll`.
- At game over, `DiceTray` is gone, so `rollButtonRef.current` is `null` and `?.` skips the call. `GameOver` handles focus then.

**Why `flushSync`?** After the third roll, Roll is disabled (`phase` is `mustScore`), and `focus()` on a disabled button does nothing. Scoring re-enables it, but only once React applies the update; a plain `dispatch` only queues it, so `focus()` would hit the disabled button. After one or two rolls the button is already enabled, so the bug shows only after the third. The test below covers that. Replace the `flushSync(…)` line with a plain `dispatch({ type: 'score', category })` and it fails:

```text
 FAIL  src/App.test.tsx > App > moves focus to the Roll button after scoring
Error: expect(element).toHaveFocus()

Expected element with focus:
  <button
  class="roll-button"
  type="button"
>
  Roll
</button>
Received element with focus:
  <body>
  <div>
    <div
      class="app"
    >
```

(The full message prints the whole page under `<body>`.)

### `Scorecard`: report the click

`Scorecard` no longer dispatches. It takes an `onScore` callback, so `Game` can follow the score with the focus move. In `src/components/Scorecard.tsx`, import only the state context:

```tsx
import { GameStateContext } from './contexts'
```

Add the props and change the start of the component:

```tsx
interface ScorecardProps {
  onScore: (category: Category) => void
}

/** One column per player; the current player's column is highlighted. */
export function Scorecard({ onScore }: ScorecardProps) {
  const state = useContext(GameStateContext)
  if (!state) throw new Error('Scorecard must be used inside <GameProvider>')
```

And in `renderRow`, call the prop:

```tsx
          onScore={() => onScore(category)}
```

Context let `Scorecard` dispatch on its own. A callback prop takes that back, because the parent now needs a say in what a score click does. Both are fine; pick the one that puts the logic where it belongs.

### `GameOver`: focus the result

At game end, the board swaps `DiceTray` for `GameOver`. Focus should go to the result, so a screen reader reads "Ada wins with 212!" at once. In `src/components/GameOver.tsx`, add this function above `resultText`:

`src/components/GameOver.tsx`

```tsx
/** A ref callback defined outside the component, so it is the same function on every render. */
function focusOnMount(node: HTMLElement | null) {
  node?.focus()
}
```

and use it on the result paragraph:

```tsx
  return (
    <div className="game-over">
      {/* tabIndex={-1}: focusable from code, but not a Tab stop. Moving focus
          here makes screen readers read the result straight away. */}
      <p ref={focusOnMount} tabIndex={-1}>
        {resultText(winners, standings[0].total, standings.length)}
      </p>
      <button type="button" className="roll-button" onClick={onPlayAgain}>
        Play again
      </button>
    </div>
  )
```

- `focusOnMount` is at module level, so it's the same function every render. React calls it once when the `<p>` appears, and with `null` when it goes (it returns no cleanup). An inline `ref={(node) => node?.focus()}` would run after *every* `GameOver` render and pull focus back to the paragraph each time (Exercise 3).
- It's a ref callback, not an Effect, because it's about one DOM node appearing, not syncing with a value. `autoFocus` would be shorter, but React applies it only to form controls, not to a `<p>`.

### Tests

Add the stubs jsdom needs to the end of `src/test/setup.ts`, and import `vi`:

`src/test/setup.ts`

```ts
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
// Adds DOM matchers such as toBeInTheDocument() and toBeDisabled() to expect().
import '@testing-library/jest-dom/vitest'

// Unmount whatever a test rendered, so the next test starts with an empty page.
// (Testing Library does this by itself only when Vitest's `globals` option is on.)
afterEach(() => {
  cleanup()
  // Saved games must not leak from one test into the next.
  localStorage.clear()
})

// jsdom implements much of the DOM, but not everything. Stub what the app uses:
// the Web Animations API and matchMedia (media queries from JavaScript).
Element.prototype.animate = vi.fn()
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList
```

- Without these, every roll in every test throws `TypeError`: jsdom's elements have no `animate`, and `window.matchMedia` doesn't exist.
- The `matchMedia` stub always answers "no preference". It has only the parts the app uses, hence the forced assertion `as unknown as MediaQueryList` ([TypeScript Crash Course, chapter 2](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/02-basic-types.md#type-assertions-as-and-)), acceptable in a test stub. The two listener methods do nothing; [Chapter 13](13-custom-hooks.md) uses them.
- The setup file runs before each test file, so every file gets fresh stubs, and Vitest clears the mock's recorded calls before each test.

In `src/App.test.tsx`, import `vi`:

```tsx
import { describe, expect, it, vi } from 'vitest'
```

In the test "plays 13 turns to the end and starts again", check that the result has focus. Replace:

```tsx
    expect(screen.getByText('Final score: 270')).toBeInTheDocument()
```

with:

```tsx
    // Focus moved to the result, so screen readers announce it.
    expect(screen.getByText('Final score: 270')).toHaveFocus()
```

Add two tests at the end of the `describe('App', …)` block:

```tsx
  it('moves focus to the Roll button after scoring', async () => {
    const user = await startGame(fakeDice(6))
    const roll = screen.getByRole('button', { name: 'Roll' })
    await user.click(roll)
    await user.click(roll)
    await user.click(roll)
    expect(roll).toBeDisabled()

    await user.click(scoreButton('Sixes'))
    expect(roll).toHaveFocus()
  })

  it('animates only the dice that are not held', async () => {
    const user = await startGame(fakeDice(6))
    // setup.ts replaced Element.prototype.animate with a mock function.
    const animate = vi.mocked(Element.prototype.animate)

    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(animate).toHaveBeenCalledTimes(5)

    await user.click(screen.getAllByRole('button', { name: 'Die showing 6' })[0])
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(animate).toHaveBeenCalledTimes(5 + 4)
  })
```

- The focus test rolls three times on purpose: then Roll is disabled and `flushSync` matters.
- jsdom draws nothing, so the animation test checks the next best thing: `animate` was called once per free die.

### Checkpoint

```console
$ npm test
...
 ✓ src/App.test.tsx (14 tests) 2989ms
...
 Test Files  8 passed (8)
      Tests  73 passed (73)

$ npm run build
...
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-AErtDXY_.css    3.29 kB │ gzip:  1.03 kB
dist/assets/index-VmU5dnri.js   231.82 kB │ gzip: 72.83 kB

$ npm run lint
...
Found 0 warnings and 0 errors.
```

Timings and file-name hashes vary.

In the browser (`npm run dev`):

- Roll: the five dice spin and shrink for a moment. Hold a die and roll again: it stays still.
- Turn on your system's reduce-motion setting (or Chrome DevTools' **Rendering → Emulate CSS media feature prefers-reduced-motion → reduce**) and reload. The dice change without spinning.
- Keyboard only: Space three times to roll, Tab to a score button, Enter. Focus lands on **Roll**, ready for the next turn.
- Finish a game. Focus is on the result text (`Final score: …` or the winner); one Tab reaches **Play again**.

The complete project at this point is in `project/ch12/`.

## Summary

- `useRef(initial)` returns `{ current }`, the same object every render; changing it doesn't re-render. Use it for values the screen doesn't show: timer ids, DOM nodes.
- Don't read or write refs during render (`react(refs)`). If the screen shows it, it's state.
- `ref={myRef}` on a built-in element: React sets `myRef.current` to the node at commit, and to `null` on removal.
- Use DOM refs for focus, scrolling, measuring, animation and non-React code, not to change what React renders.
- In React 19, `ref` is an ordinary prop of function components: declare `ref?: Ref<T>` and pass it on; no `forwardRef`. `useImperativeHandle` exposes a custom object instead of the node.
- A **ref callback** gets the node on attach and (since React 19) can return a cleanup. Inline callbacks re-run every render; module-level ones only when the node changes. Strict Mode runs them twice on mount.
- When you remove the focused element, move focus somewhere sensible. `tabIndex={-1}` makes any element focusable from code.
- `element.animate(keyframes, options)` plays an animation on demand; check `matchMedia('(prefers-reduced-motion: reduce)')` first.
- `flushSync(fn)` applies an update to the DOM immediately, for the rare handler that needs the new DOM on its next line.
- `useLayoutEffect` + a ref measures layout before paint.
- jsdom has no layout, `animate`, `matchMedia` or `scrollIntoView`: stub what you call.

## Exercises

1. **Don't drop focus on Remove.** On the new-game form, each row's **Remove** button removes its own row, so the focused button disappears and focus falls to `<body>`. Move focus to the name field of the row that takes its place (or of the new last row), and add a test to `NewGameForm.test.tsx`.

<details><summary>Solution</summary>

Collect the inputs in a `Map` with ref callbacks, like the player list in [Ref callbacks](#ref-callbacks). In `src/components/NewGameForm.tsx`, import `useRef` and add the ref after `formId`:

```tsx
import { useActionState, useId, useRef, useState } from 'react'
```

```tsx
  // Each row's name input, by row id, kept up to date by ref callbacks.
  const inputs = useRef(new Map<number, HTMLInputElement>())
```

On the `<input>`, after `id={inputId}`:

```tsx
                ref={(node) => {
                  if (!node) return
                  inputs.current.set(row.id, node)
                  return () => {
                    inputs.current.delete(row.id)
                  }
                }}
```

Change `removePlayer`:

```tsx
  function removePlayer(id: number) {
    const index = rows.findIndex((row) => row.id === id)
    const rest = rows.filter((row) => row.id !== id)
    setRows(rest)
    // The clicked button is about to disappear. Focus the name of the row that
    // moves into its place, or of the new last row. That input is already on
    // the page, so no flushSync is needed.
    inputs.current.get(rest[Math.min(index, rest.length - 1)].id)?.focus()
  }
```

The test, inside `describe('NewGameForm', …)`:

```tsx
  it('moves focus to a name field after Remove', async () => {
    const user = userEvent.setup()
    render(<NewGameForm onStart={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Add player' }))
    await user.click(screen.getByRole('button', { name: 'Add player' }))

    await user.click(screen.getByRole('button', { name: 'Remove player 2' }))
    // The third row moved up into second place.
    const second = screen.getByRole('textbox', { name: 'Player 2' })
    expect(second).toHaveValue('Player 3')
    expect(second).toHaveFocus()

    // Removing the last row focuses the row above it.
    await user.click(screen.getByRole('button', { name: 'Remove player 2' }))
    expect(screen.getByRole('textbox', { name: 'Player 1' })).toHaveFocus()
  })
```

`npm test` reports 74 tests. Without the `focus()` line the test fails with focus on `<body>`.

- Why the name field, not the next Remove button? With one row left, its Remove button is disabled, and `focus()` on a disabled button does nothing. An input is always focusable.
- Unlike in the `flushSync` demo, the target already exists before the update, so `focus()` can run straight after `setRows`.
- `rest` always has a row: Remove is disabled when only one is left.

</details>

2. **Shake the form.** When the new-game form is submitted with an error (try an empty name), shake the whole form like the shake example, unless the user prefers reduced motion. Test that `animate` was called once, on the `<form>`.

<details><summary>Solution</summary>

In `src/components/NewGameForm.tsx`, add the keyframes above the component:

```tsx
const SHAKE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-8px)' },
  { transform: 'translateX(8px)' },
  { transform: 'translateX(0)' },
]
```

A ref for the form (with `useRef` imported), placed on the `<form>`:

```tsx
  const formRef = useRef<HTMLFormElement>(null)
```

```tsx
    <form ref={formRef} className="new-game-form" action={formAction}>
```

In the action, shake when there's an error:

```tsx
    const error = validatePlayerNames(playerNames)
    if (!error) {
      onStart({ playerNames, settings: { fiveOfAKindBonus } })
    } else if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      formRef.current?.animate(SHAKE, { duration: 300, easing: 'ease-in-out' })
    }
    return { error, fiveOfAKindBonus }
```

The test uses the stubs from `setup.ts`:

```tsx
  it('shakes the form when it is invalid', async () => {
    const user = userEvent.setup()
    render(<NewGameForm onStart={() => {}} />)
    await user.clear(screen.getByRole('textbox', { name: 'Player 1' }))
    await user.click(screen.getByRole('button', { name: 'Start game' }))

    const animate = vi.mocked(Element.prototype.animate)
    expect(animate).toHaveBeenCalledOnce()
    expect(animate.mock.contexts[0]).toBeInstanceOf(HTMLFormElement)
  })
```

The action runs because of a submit, so it's the right place for a one-off animation. A ref callback on the error message would shake only when the message first appears, not on a second failed submit.

</details>

3. **Inline or stable?** `GameOver` uses a module-level `focusOnMount`. Predict what changes with an inline `ref={(node) => node?.focus()}`. Check with a component that has a focusable `<p>` and a button that changes some state.

<details><summary>Solution</summary>

The inline callback is a new function every render, so React calls it after every render and focus jumps back to the paragraph each time. The module-level function is called only when the `<p>` mounts.

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it } from 'vitest'

function focusOnMount(node: HTMLElement | null) {
  node?.focus()
}

function Inline() {
  const [clicks, setClicks] = useState(0)
  return (
    <div>
      <p ref={(node) => node?.focus()} tabIndex={-1}>Result</p>
      <button type="button" onClick={() => setClicks(clicks + 1)}>Clicked {clicks}</button>
    </div>
  )
}

function Stable() {
  const [clicks, setClicks] = useState(0)
  return (
    <div>
      <p ref={focusOnMount} tabIndex={-1}>Result</p>
      <button type="button" onClick={() => setClicks(clicks + 1)}>Clicked {clicks}</button>
    </div>
  )
}

it.each([
  ['inline', Inline, 'P'],
  ['stable', Stable, 'BUTTON'],
])('focus after a re-render with an %s ref callback', async (_name, Component, focused) => {
  const user = userEvent.setup()
  render(<Component />)
  expect(document.activeElement?.tagName).toBe('P')
  await user.click(screen.getByRole('button'))
  expect(document.activeElement?.tagName).toBe(focused)
})
```

`document.activeElement` is the focused element. Clicking the button focuses it, then the click re-renders the component: the inline callback steals focus back; the stable one doesn't.

</details>

Sources for this chapter: [REFERENCES.md](REFERENCES.md#chapter-12--refs-and-the-dom)
