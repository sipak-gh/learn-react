# Chapter 11 — Effects

So far every side effect in the game has run in an event handler: the player clicks, something changes. Some code must run because a component is *on screen*: the tab title should name the current player, a key listener should exist while the dice are visible, the saved game should match the one being played. **Effects** do this. This chapter covers how they work, why Strict Mode runs them twice, dependency arrays, and the most important lesson: when you *don't* need an Effect. The game from [Chapter 10](10-composition-and-context.md) gets a live tab title, keyboard shortcuts and a save that survives a reload. [Chapter 12](12-refs-and-the-dom.md) then reaches into the DOM with refs.

## Effects synchronise with the outside world

Rendering must be pure ([Chapter 4](04-components-and-jsx.md)): a component only computes JSX from props and state. Side effects go in event handlers ([Chapter 5](05-state-and-events.md)), which run because the user did something specific.

Some side effects have no single cause. A chat room should be connected while it's on screen, whichever click opened it. That's **synchronisation**: keeping something outside React in step with what React shows.

An **Effect** is a function React runs *after* updating the DOM for a render. It synchronises an **external system**, something React doesn't control, with your props and state:

- browser APIs: `document.title`, `localStorage`, event listeners on `window`, timers;
- the network: a socket, a fetch;
- non-React code: a map widget, a video player.

If both sides of the "sync" are React state, there's no external system and no need for an Effect (more below).

## `useEffect`: setup, cleanup, dependencies

A chat room that connects while it's shown. The connection is fake: it logs instead of talking to a server.

`examples/ch11/chat-room.demo.tsx`

```tsx
import { useEffect, useState } from 'react'

// A pretend external system: think of a socket to a chat server.
function createConnection(roomId: string) {
  return {
    connect: () => console.log(`connect to "${roomId}"`),
    disconnect: () => console.log(`disconnect from "${roomId}"`),
  }
}

function ChatRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    // Setup: start synchronising with the external system.
    const connection = createConnection(roomId)
    connection.connect()
    // Cleanup: stop synchronising. React runs it before the next setup and on unmount.
    return () => connection.disconnect()
  }, [roomId]) // Re-synchronise whenever roomId changes.

  return <p>Welcome to the {roomId} room.</p>
}

export default function ChatRoomDemo() {
  const [roomId, setRoomId] = useState('general')
  const [open, setOpen] = useState(true)

  return (
    <main>
      <label>
        Room{' '}
        <select value={roomId} onChange={(event) => setRoomId(event.target.value)}>
          <option value="general">general</option>
          <option value="travel">travel</option>
        </select>
      </label>{' '}
      <button type="button" onClick={() => setOpen(!open)}>
        {open ? 'Close chat' : 'Open chat'}
      </button>
      {open && <ChatRoom roomId={roomId} />}
    </main>
  )
}
```

`useEffect(setup, dependencies)` has three parts:

- **Setup**: the function you pass. React calls it after the component is on screen.
- **Cleanup**: the function setup returns (optional). It undoes setup. React calls it before running setup again and on unmount.
- **Dependencies**: the array. React re-runs cleanup + setup only when a value in it changed since the last render (`Object.is`).

Run `npm run dev` in `examples/`, open `http://localhost:5173/?demo=ch11/chat-room` and the browser console (F12). Select **travel**, then click **Close chat**. The console shows:

```text
connect to "general"
disconnect from "general"
connect to "general"
disconnect from "general"
connect to "travel"
disconnect from "travel"
```

The next section explains lines 2 and 3. The rest:

1. `ChatRoom` mounts: setup connects to `general`.
2. `roomId` changes: cleanup disconnects from `general` (the *old* render's cleanup, with the old `roomId`), then setup connects to `travel`.
3. `ChatRoom` unmounts: cleanup disconnects from `travel`.

An Effect is "how to start syncing" plus "how to stop", and React may do both many times. Don't think "on mount" and "on update"; think "what must this stay in sync with?"

The dependency array has three forms:

| Call | Setup runs after |
|------|------------------|
| `useEffect(fn, [a, b])` | the first render, and every render where `a` or `b` changed |
| `useEffect(fn, [])` | the first render only |
| `useEffect(fn)` | every render |

With no array, an Effect that sets state causes a render, which runs the Effect, which sets state: an endless loop. You'll rarely want that form.

## Strict Mode runs setup twice

The extra `disconnect` / `connect` pair came from `<StrictMode>` in `main.tsx`. In development, Strict Mode mounts each component, unmounts it and mounts it again. (Its other check, rendering twice, is in [Chapter 4](04-components-and-jsx.md).) For Effects:

```text
setup → cleanup → setup
```

Why? Users leave a screen and come back, and your Effect must cope. If cleanup doesn't exactly undo setup, the double run shows it at once: two connections, two listeners, a timer running twice as fast. The fix is always a correct cleanup, never a trick to run the Effect once. Production builds don't do this.

Testing Library can turn on Strict Mode for one render with the `reactStrictMode` option:

`examples/ch11/chat-room.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import ChatRoomDemo from './chat-room.demo'

/** Everything the demo logged, one string per console.log call. */
function spyOnLog() {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  return () => log.mock.calls.map((args) => args.join(' '))
}

it('connects, reconnects when the room changes, and disconnects on unmount', async () => {
  const logged = spyOnLog()
  const user = userEvent.setup()
  render(<ChatRoomDemo />)
  await user.selectOptions(screen.getByRole('combobox', { name: 'Room' }), 'travel')
  await user.click(screen.getByRole('button', { name: 'Close chat' }))

  expect(logged()).toEqual([
    'connect to "general"',
    'disconnect from "general"',
    'connect to "travel"',
    'disconnect from "travel"',
  ])
})

it('runs setup, cleanup, setup on mount in Strict Mode', () => {
  const logged = spyOnLog()
  // The same as wrapping the tree in <StrictMode>, like main.tsx does.
  render(<ChatRoomDemo />, { reactStrictMode: true })

  expect(logged()).toEqual(['connect to "general"', 'disconnect from "general"', 'connect to "general"'])
})
```

`vi.spyOn(console, 'log')` replaces `console.log` with a recording mock; `mockImplementation(() => {})` keeps the output quiet. Vitest clears recorded calls before each test (`clearMocks` is on by default, [Chapter 8](08-testing.md)), so each test sees only its own logs.

```console
$ npx vitest run ch11/chat-room
 ✓ ch11/chat-room.test.tsx (2 tests) 138ms
   ✓ connects, reconnects when the room changes, and disconnects on unmount 133ms
   ✓ runs setup, cleanup, setup on mount in Strict Mode 4ms
```

### Coming from vanilla JavaScript: why cleanup?

[Chapter 2](02-from-vanilla-dom-to-react.md#a-dice-roller-without-react)'s dice roller runs `rollButton.addEventListener('click', roll)` once, when the page loads, and never removes it. It doesn't have to: the button and the listener live exactly as long as the page.

A React component is different. It can mount, unmount and mount again many times while the page stays open: a dialog opens and closes, the player switches screens. Each mount runs setup again. Anything setup adds to a longer-lived object, such as `window`, `document`, a timer or a connection, piles up unless cleanup removes it:

`examples/ch11/key-listener.demo.tsx`

```tsx
import { useEffect, useState } from 'react'

// 🔴 Adds a new listener on every mount and never removes it.
function Leaky() {
  useEffect(() => {
    window.addEventListener('keydown', (event) => console.log(`leaky saw ${event.key}`))
  }, [])
  return <p>Leaky is listening.</p>
}

// ✅ Cleanup removes the same function that setup added.
function Tidy() {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      console.log(`tidy saw ${event.key}`)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  return <p>Tidy is listening.</p>
}

export default function KeyListener() {
  const [shown, setShown] = useState(true)

  return (
    <main>
      <button type="button" onClick={() => setShown(!shown)}>
        {shown ? 'Hide' : 'Show'}
      </button>
      {shown && (
        <>
          <Leaky />
          <Tidy />
        </>
      )}
    </main>
  )
}
```

Open `?demo=ch11/key-listener` with the console open. Press `a`, click **Hide** and press `b`, then click **Show** and press `c`:

```text
leaky saw a
leaky saw a
tidy saw a
leaky saw b
leaky saw b
leaky saw c
leaky saw c
leaky saw c
leaky saw c
tidy saw c
```

Strict Mode's extra mount already doubles the leaky listener. Hiding doesn't remove it, and each new mount adds more. `Tidy` always logs once. `examples/ch11/key-listener.test.tsx` checks the same without Strict Mode (1, then 1 while hidden, then 2 leaky listeners).

`removeEventListener` must get the *same function* that was added, which is why `Tidy` names it. Two rules decide where listeners go:

- **Elements you render get JSX event props** (`onClick`, `onKeyDown`), never `addEventListener`. React adds and removes those for you.
- **Effects are for objects React doesn't render**: `window`, `document`, timers, sockets, non-React widgets.

## Dependencies are what the Effect reads

Props, state and anything computed from them in the component body are **reactive values**: they can change between renders. An Effect must list every reactive value it reads, or it keeps the value from the render that created it.

You don't *choose* dependencies; the code decides and the linter checks. Oxlint's `react-hooks/exhaustive-deps` rule (on in the examples and the project) reports any reactive value an Effect reads but doesn't list. To change the dependencies, change the code.

A timer shows the usual problem and fix:

`examples/ch11/timer.demo.tsx`

```tsx
import { useEffect, useState } from 'react'

export default function TimerDemo() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return // nothing to synchronise, so no cleanup either
    const id = setInterval(() => {
      // An updater function: reads the latest value, so `seconds`
      // doesn't have to be a dependency.
      setSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  return (
    <main>
      <p>{seconds} s</p>
      <button type="button" onClick={() => setRunning(!running)}>
        {running ? 'Pause' : 'Start'}
      </button>
    </main>
  )
}
```

- The interval is the external system: setup starts it, cleanup stops it.
- The Effect reads `running`, so it's a dependency. Pause sets it to `false`: cleanup clears the interval and the new setup returns early.
- `setSeconds((s) => s + 1)` is the updater form ([Chapter 5](05-state-and-events.md)). React passes in the current value, so the Effect never reads `seconds` and needn't list it. `[running, seconds]` would also work, but would restart the interval every second.

### Gotcha: a missing dependency

The bug the linter exists for: this timer has an empty array but reads `seconds`:

`examples/ch11/timer.test.tsx` (part)

```tsx
// 🔴 The bug that a missing dependency causes.
function StaleTimer() {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    // This closure belongs to the first render, where seconds is 0.
    const id = setInterval(() => setSeconds(seconds + 1), 1000)
    return () => clearInterval(id)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- the bug we are demonstrating
  }, [])
  return <p>{seconds} s</p>
}
```

The Effect ran once, after the first render, so its interval callback sees `seconds = 0` forever. Every tick sets `0 + 1`, so the display stops at `1 s`. Delete the `oxlint-disable` line and the linter explains:

```console
$ npx oxlint ch11/timer.test.tsx
  ⚠ react-hooks(exhaustive-deps): React Hook useEffect has a missing dependency: 'seconds'
    ╭─[ch11/timer.test.tsx:37:6]
 34 │     // This closure belongs to the first render, where seconds is 0.
 35 │     const id = setInterval(() => setSeconds(seconds + 1), 1000)
    ·                                             ───┬───
    ·                                                ╰── useEffect uses `seconds` here
 36 │     return () => clearInterval(id)
 37 │   }, [])
    ·      ──
 38 │   return <p>{seconds} s</p>
    ╰────
  help: Either include it or remove the dependency array.

Found 1 warning and 0 errors.
Finished in 10ms on 1 file with 116 rules using 32 threads.
```

Of its two fixes, adding `seconds` restarts the interval every second, and removing the array runs the Effect after every render. The updater function beats both: it removes the dependency. Treat a "missing dependency" warning as a bug report, not noise.

The rest of the file tests both timers. Vitest's **fake timers** replace `setInterval` and friends with versions that fire only when the test moves the clock:

`examples/ch11/timer.test.tsx` (the rest)

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TimerDemo from './timer.demo'

// Fake timers: setInterval only fires when the test moves the clock.
beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

/** Let `ms` milliseconds pass. act() applies the resulting state updates. */
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))

it('ticks while running and stops when paused', () => {
  render(<TimerDemo />)

  // fireEvent dispatches the click at once, without user-event's timers.
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  wait(3000)
  expect(screen.getByText('3 s')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
  wait(3000)
  expect(screen.getByText('3 s')).toBeInTheDocument()
})

// (StaleTimer from above)

it('gets stuck at 1 when the Effect reads a stale value', () => {
  render(<StaleTimer />)
  wait(3000)
  expect(screen.getByText('1 s')).toBeInTheDocument()
})
```

- `act()` tells React "state may change in here; apply it before returning". Testing Library wraps its own calls in `act`; other triggers, like moving a fake clock, need it by hand.
- `fireEvent.click` dispatches one `click` synchronously. `user-event` and Testing Library wait for short `setTimeout`s between steps. A fake clock never fires them on its own, so a plain `user.click` here hangs until the test times out.

To keep `user-event`, let the fake clock follow real time and tell `user-event` to move the clock itself:

`examples/ch11/timer-user-event.test.tsx` (part)

```tsx
beforeEach(() => {
  // The fake clock also follows real time, so user-event's short waits finish.
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

it('ticks while running and stops when paused, clicked with user-event', async () => {
  // user-event moves the fake clock by its own delays instead of waiting for them.
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(<TimerDemo />)

  await user.click(screen.getByRole('button', { name: 'Start' }))
  wait(3000)
  expect(screen.getByText('3 s')).toBeInTheDocument()
  // ...
})
```

Both settings are needed under Vitest; with only `advanceTimers`, the click still hangs. The clock now drifts a few real milliseconds, which is harmless for a 1-second timer. For one click, `fireEvent` is simpler.

```console
$ npx vitest run ch11/timer
 ✓ ch11/timer.test.tsx (2 tests) 98ms
 ✓ ch11/timer-user-event.test.tsx (1 test) 121ms
```

### Gotcha: an object that is new on every render

An object or function created during render is a *new* value every render, even with the same contents, so `Object.is` sees a change. An Effect that depends on one runs after every render:

`examples/ch11/object-deps.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import { expect, it } from 'vitest'

// Every room we connected to, in order.
let connected: string[] = []

// A pretend connection. Returns the function that disconnects.
function connect(options: { serverUrl: string; roomId: string }) {
  connected.push(options.roomId)
  return () => {}
}

// 🔴 An object built during render is a new object every render.
function ChatWithObjectDep({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState('')
  const options = { serverUrl: 'https://chat.example', roomId }
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- the bug we are demonstrating
  useEffect(() => connect(options), [options])
  return <input aria-label="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
}

// ✅ Build the object inside the Effect and depend on the string.
function ChatWithStringDep({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState('')
  useEffect(() => {
    const options = { serverUrl: 'https://chat.example', roomId }
    return connect(options)
  }, [roomId])
  return <input aria-label="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
}

it.each([
  ['an object dependency', ChatWithObjectDep, ['general', 'general', 'general', 'general']],
  ['a string dependency', ChatWithStringDep, ['general']],
])('connects with %s', async (_name, Chat, expected) => {
  connected = []
  const user = userEvent.setup()
  render(<Chat roomId="general" />)
  await user.type(screen.getByRole('textbox', { name: 'Message' }), 'hi!')
  expect(connected).toEqual(expected)
})
```

Typing three characters causes three more renders. The first version reconnects each time (four connections); the second connects once.

`it.each(rows)(name, fn)` runs the test once per row, passing the row's items as `fn`'s arguments; `%s` in the name becomes the row's first item.

```console
$ npx vitest run ch11/object-deps
 ✓ ch11/object-deps.test.tsx (2 tests) 133ms
   ✓ connects with an object dependency 114ms
   ✓ connects with a string dependency 18ms
```

The linter spots this too:

```console
$ npx oxlint ch11/object-deps.test.tsx
  ⚠ react-hooks(exhaustive-deps): React hook useEffect depends on `options`, which changes every render
    ╭─[ch11/object-deps.test.tsx:18:38]
 16 │   const [message, setMessage] = useState('')
 17 │   const options = { serverUrl: 'https://chat.example', roomId }
    ·         ───┬───
    ·            ╰── `options` is declared here
 18 │   useEffect(() => connect(options), [options])
    ·                                      ───┬───
    ·                                         ╰── it will always cause this hook to re-evaluate
 19 │   return <input aria-label="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
    ╰────
  help: Try memoizing this variable with `useRef` or `useCallback`.

Found 1 warning and 0 errors.
Finished in 11ms on 1 file with 116 rules using 32 threads.
```

(That's with the `oxlint-disable` line removed.) Memoizing, as the help suggests ([Chapter 16](16-rendering-and-performance.md)), works, but it's simpler to depend on primitives: build the object inside the Effect and list the strings and numbers it's made from.

## You might not need an Effect

Effects are an escape hatch to systems outside React. Beginners often use them where no outside system is involved, making code longer, slower and harder to follow. Check this list first:

| You want to… | Use instead |
|--------------|-------------|
| compute a value from props or state | a plain variable in the component body |
| react to a user action (send, save, navigate) | the event handler for that action |
| reset all state when a prop changes | a `key` ([Chapter 10](10-composition-and-context.md)) |
| read something once, for the initial state | an initializer function: `useState(() => …)` |
| tell the parent something changed | call its callback in the same event handler |
| avoid recomputing something expensive | `useMemo` ([Chapter 16](16-rendering-and-performance.md)) |

### Derived data: compute it during render

The most common mistake: copying props or state into more state and syncing the copy with an Effect. This test records what each version shows on every render:

`examples/ch11/derived-state.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import { expect, it } from 'vitest'

// What each render showed, in order. (Pushing to an outer array during render
// is impure; it's fine for a measurement like this, never in real code.)
let shown: string[] = []

// 🔴 Redundant state, kept in sync by an Effect.
function FullNameWithEffect() {
  const [first, setFirst] = useState('Ada')
  const [fullName, setFullName] = useState('')
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- the anti-pattern we are measuring
    setFullName(`${first} Lovelace`)
  }, [first])
  shown.push(fullName)
  return <input aria-label="First name" value={first} onChange={(e) => setFirst(e.target.value)} />
}

// ✅ Derived during render.
function FullNameDerived() {
  const [first, setFirst] = useState('Ada')
  const fullName = `${first} Lovelace`
  shown.push(fullName)
  return <input aria-label="First name" value={first} onChange={(e) => setFirst(e.target.value)} />
}

it.each([
  ['with an Effect', FullNameWithEffect, ['', 'Ada Lovelace', 'Ada Lovelace', 'Adam Lovelace']],
  ['derived', FullNameDerived, ['Ada Lovelace', 'Adam Lovelace']],
])('full name %s', async (_name, Component, expected) => {
  shown = []
  const user = userEvent.setup()
  render(<Component />)
  await user.type(screen.getByRole('textbox', { name: 'First name' }), 'm')
  expect(shown).toEqual(expected)
})
```

```console
$ npx vitest run ch11/derived-state
 ✓ ch11/derived-state.test.tsx (2 tests) 120ms
   ✓ full name with an Effect 106ms
   ✓ full name derived 13ms
```

The Effect version renders twice as often, and two renders show stale data:

1. First render: `fullName` is still `''`; a real screen would flash an empty name.
2. The Effect sets the full name: a second render.
3. Typing `m` changes `first` and renders the *old* full name, `Ada Lovelace`.
4. The Effect catches up: a fourth render shows `Adam Lovelace`.

The derived version is right every render, with less code. Remove the `oxlint-disable` comment and Oxlint names the problem:

```console
$ npx oxlint ch11/derived-state.test.tsx
  ⚠ react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders
    ╭─[ch11/derived-state.test.tsx:15:5]
 13 │   const [fullName, setFullName] = useState('')
 14 │   useEffect(() => {
    ·   ────┬────
    ·       ╰── This is the containing effect
 15 │     setFullName(`${first} Lovelace`)
    ·     ─────┬─────
    ·          ╰── Avoid calling setState() directly within an effect
 16 │   }, [first])
    ╰────
  help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
  note: React Compiler skipped optimizing this component or hook. Additional guidance: https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect

Found 1 warning and 0 errors.
Finished in 11ms on 1 file with 116 rules using 32 threads.
```

The rule fires only when the Effect calls `setState` *directly*. Setting state later, in a listener or `.then()` callback, is fine: that's how outside data gets into React.

### Event-specific logic: put it in the handler

Ask *why* the code runs:

- **The user did something** (clicked Buy, submitted a form, chose "New game"): it belongs in that event's handler, which knows exactly what happened.
- **The component is showing something** (the chat must be connected, the title must match the player): it's an Effect.

A common mistake is an Effect that watches for a state change that "means" an event happened, such as running purchase code when `cart.length` drops to zero. The Effect can't tell *why* the state changed, so it also runs after a reload, in Strict Mode, or when other code sets the same state. Exercise 3 shows this bug.

### Initial state from outside: use an initializer

To start from a value stored in the browser, don't render a default and fix it in an Effect. Pass a function to `useState`; React calls it once, during the first render:

```tsx
const [session, setSession] = useState(resumeSession) // not useState(resumeSession())
```

`useState(resumeSession())` also works, but calls `resumeSession` (reading storage) on every render and discards the result. The project uses this below.

## Race conditions

Fetching is synchronisation too: "show results for the current query". But answers arrive in their own time. Type `a`, then `ad`, and the answer for `a` can arrive *after* the one for `ad` and overwrite it.

This pretend server makes short queries slow, so that always happens:

`examples/ch11/slow-search.ts`

```ts
const NAMES = ['Ada', 'Adele', 'Alan', 'Bo', 'Cy', 'Grace']

/** A pretend server. Short queries happen to be slow, so answers can arrive out of order. */
export function slowSearch(query: string): Promise<string[]> {
  const found = NAMES.filter((name) => name.toLowerCase().startsWith(query.toLowerCase()))
  const latency = Math.max(100, 1200 - 400 * query.length)
  return new Promise((resolve) => setTimeout(() => resolve(found), latency))
}
```

`a` takes 800 ms; `ad` takes 400 ms. The fix is a flag in the Effect's closure, set by its cleanup:

`examples/ch11/search-race.demo.tsx`

```tsx
import { useEffect, useState } from 'react'
import { slowSearch } from './slow-search'

interface ResultsProps {
  query: string
  search: (query: string) => Promise<string[]>
  ignoreStale: boolean
}

export function Results({ query, search, ignoreStale }: ResultsProps) {
  const [answer, setAnswer] = useState<{ query: string; names: string[] } | null>(null)

  useEffect(() => {
    let ignore = false
    search(query).then((names) => {
      if (ignore && ignoreStale) return // a newer query has replaced this one
      setAnswer({ query, names })
    })
    return () => {
      ignore = true
    }
  }, [query, search, ignoreStale])

  if (!answer) return <p>Searching…</p>
  return (
    <p>
      Results for "{answer.query}": {answer.names.join(', ') || 'none'}
    </p>
  )
}

export default function SearchRaceDemo() {
  const [query, setQuery] = useState('a')
  const [ignoreStale, setIgnoreStale] = useState(true)

  return (
    <main>
      <label>
        Search <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <label>
        <input type="checkbox" checked={ignoreStale} onChange={(event) => setIgnoreStale(event.target.checked)} />
        Ignore stale responses
      </label>
      <Results query={query} search={slowSearch} ignoreStale={ignoreStale} />
    </main>
  )
}
```

Each Effect run has its own `ignore`. When `query` changes, the old run's cleanup sets *its* `ignore` to `true`, so when the old answer arrives, its `.then` drops it. Only the latest run can set state. (The checkbox switches the fix off so you can see the bug.)

`examples/ch11/search-race.test.tsx`

```tsx
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Results } from './search-race.demo'
import { slowSearch } from './slow-search'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

/** Type "a", then "ad" 50 ms later. The answer for "a" is slower, so it arrives last. */
async function typeAThenAd(ignoreStale: boolean) {
  const { rerender } = render(<Results query="a" search={slowSearch} ignoreStale={ignoreStale} />)
  await act(() => vi.advanceTimersByTimeAsync(50))
  rerender(<Results query="ad" search={slowSearch} ignoreStale={ignoreStale} />)
  await act(() => vi.advanceTimersByTimeAsync(2000))
  return screen.getByRole('paragraph').textContent
}

it('shows the stale answer without the ignore flag', async () => {
  expect(await typeAThenAd(false)).toBe('Results for "a": Ada, Adele, Alan')
})

it('keeps the latest answer with the ignore flag', async () => {
  expect(await typeAThenAd(true)).toBe('Results for "ad": Ada, Adele')
})
```

`rerender` renders the tree again with new props, as a parent would. `advanceTimersByTimeAsync` also lets promises resolved by the timers run their `.then` callbacks.

```console
$ npx vitest run ch11/search-race
 ✓ ch11/search-race.test.tsx (2 tests) 126ms
   ✓ shows the stale answer without the ignore flag 115ms
   ✓ keeps the latest answer with the ignore flag 10ms
```

In the browser (`?demo=ch11/search-race`), untick **Ignore stale responses**, clear the box, wait for the result, then type `ad` quickly. The page shows `Results for "a": Ada, Adele, Alan` while the box says `ad`. Tick the box and repeat: the answer for `ad` stays.

### Cancelling `fetch` with `AbortController`

With real `fetch`, the cleanup can do better than ignore the answer: it can cancel the request. An [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) works the same as in vanilla code. Pass its `signal` to `fetch`, and `abort()` cancels the request and makes `fetch` reject with an `AbortError`:

`examples/ch11/search-abort.demo.tsx`

```tsx
import { useEffect, useState } from 'react'

/** Fetches the name list and keeps the names that start with `query`. */
async function searchNames(query: string, signal: AbortSignal): Promise<string[]> {
  const response = await fetch('/ch11/names.json', { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const names = (await response.json()) as string[]
  return names.filter((name) => name.toLowerCase().startsWith(query.toLowerCase()))
}

export default function AbortSearchDemo() {
  const [query, setQuery] = useState('a')
  const [names, setNames] = useState<string[] | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    searchNames(query, controller.signal)
      .then((found) => setNames(found))
      .catch((error: unknown) => {
        // abort() makes fetch reject with an AbortError: expected, not a failure.
        if (!controller.signal.aborted) console.error(error)
      })
    return () => controller.abort()
  }, [query])

  return (
    <main>
      <label>
        Search <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <p>{names ? names.join(', ') || 'none' : 'Searching…'}</p>
    </main>
  )
}
```

`examples/ch11/names.json` is a static list, so the filtering happens in the browser; a real server would filter by the query. Open `?demo=ch11/search-abort` with the DevTools **Network** tab open: Strict Mode's extra setup/cleanup shows up as a first `names.json` request marked *(canceled)*, and typing quickly cancels each request the next keystroke replaces. `examples/ch11/search-abort.test.tsx` stubs `fetch` ([Chapter 8](08-testing.md#mocking-modules-and-fetch)) with one that waits 100 ms and rejects when aborted, then checks that the request for `a` was aborted and the one for `ad` was not.

Either fix, the `ignore` flag or `abort()`, makes the Effect safe. Hand-written fetch Effects still grow long once they need loading and error states, caching and retries. Real apps usually hand them to a library such as [TanStack Query](https://tanstack.com/query/latest) or to a framework's data loader. [Chapter 17](17-async-react.md) shows React's built-in way to wait for data, and [Chapter 20](20-where-next.md#state-and-data-libraries) compares the libraries.

## Effect Events: `useEffectEvent`

Sometimes an Effect must *read* a value without *reacting* to it. The classic case is a key listener. Here, the arrow keys move a counter by `step`:

`examples/ch11/arrow-counter.demo.tsx`

```tsx
import { useEffect, useEffectEvent, useState } from 'react'

/** Press the arrow keys to move by `step`. */
export default function ArrowCounter() {
  const [count, setCount] = useState(0)
  const [step, setStep] = useState(1)

  // An Effect Event: always sees the latest `step`, but is not reactive,
  // so changing `step` does not re-subscribe the listener below.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'ArrowUp') setCount((c) => c + step)
    if (event.key === 'ArrowDown') setCount((c) => c - step)
  })

  useEffect(() => {
    console.log('subscribe keydown')
    window.addEventListener('keydown', onKeyDown)
    return () => {
      console.log('unsubscribe keydown')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <main>
      <p>Count: {count}</p>
      <button type="button" onClick={() => setStep(step === 1 ? 10 : 1)}>
        Step: {step}
      </button>
      <p>Press ↑ or ↓.</p>
    </main>
  )
}
```

Without `useEffectEvent`, the listener reads `step`, so the Effect needs `[step]` and re-subscribes on every step change. Here that's only wasteful; for a chat connection, reconnecting because an unrelated setting changed would be a real bug.

`useEffectEvent(fn)` returns an **Effect Event**: a function that always calls the *latest* render's `fn`, so it sees the latest props and state. It isn't reactive, so it stays out of the dependency array (the linter knows), and the Effect subscribes once.

`examples/ch11/arrow-counter.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import ArrowCounter from './arrow-counter.demo'

it('uses the latest step without re-subscribing', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const user = userEvent.setup()
  render(<ArrowCounter />)

  await user.keyboard('{ArrowUp}')
  await user.click(screen.getByRole('button', { name: 'Step: 1' }))
  await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}')

  expect(screen.getByText('Count: 11')).toBeInTheDocument()
  expect(log.mock.calls).toEqual([['subscribe keydown']])
})
```

`1 + 10 + 10 - 10 = 11`: the listener used the new step, and subscribed once.

```console
$ npx vitest run ch11/arrow-counter
 ✓ ch11/arrow-counter.test.tsx (1 test) 165ms
   ✓ uses the latest step without re-subscribing 164ms
```

In the browser (`?demo=ch11/arrow-counter`), the console shows `subscribe keydown`, `unsubscribe keydown`, `subscribe keydown` on load (Strict Mode again). After that, clicking **Step** logs nothing.

`useEffectEvent` is stable since React 19.2. Its rules:

- Call an Effect Event only from Effects (including callbacks they set up, like this listener), never during render or from event handlers.
- Don't pass it to other components or Hooks.
- Use it for logic that really is an "event" fired from an Effect, not to hide a dependency the Effect should react to.

## `useLayoutEffect`

`useLayoutEffect` has the same signature as `useEffect`, but different timing:

- `useEffect` runs after React updates the DOM, usually after the browser paints.
- `useLayoutEffect` runs after the DOM update but *before* the browser paints; the browser waits for it.

Use it only to **measure** layout (an element's size or position) and change something before the user sees a frame, such as placing a tooltip. It blocks painting, so it can make the app feel slow; default to `useEffect`. [Chapter 12](12-refs-and-the-dom.md) measures with it, once refs give you DOM nodes.

## Three external systems

The project syncs with three browser APIs you know from vanilla code. What matters here:

- **`document.title`**: React doesn't render it, so an Effect sets it. (React 19 can also render a [`<title>`](https://react.dev/reference/react-dom/components/title) from any component and moves it into `<head>`; the Effect shows the pattern for any value React doesn't render.)
- **`localStorage`**: strings only (`JSON.stringify` / `JSON.parse`), synchronous, per origin. What you read is **untrusted**: an older version of the app may have saved another shape, or the user may have edited it in DevTools' **Application** tab (Firefox: **Storage**). Validate it.
- **`keydown` on `window`** sees every key press on the page. Cleanup must pass the *same function* to `removeEventListener`. The project reads `event.key` (`' '` for Space, `'1'` to `'5'`), skips auto-repeats (`event.repeat`) and Ctrl/⌘/Alt combinations (left to the browser), and calls `event.preventDefault()` so Space doesn't scroll the page.

## Building five-dice: title, keyboard, save and resume

In this step you:

- show whose turn it is in the browser tab: `Ada · turn 3/13 · Five Dice`;
- let players roll with Space and hold dice with the keys 1–5;
- save the game in `localStorage` after every change, and resume it after a reload;
- forget the saved game at game over and when the player chooses **New game**.

Each syncs an external system: the tab title, the keyboard, storage. Everything else stays in render and event handlers.

### Saving and loading: `storage.ts`

Create `src/game/storage.ts` to keep all `localStorage` code in one place:

`src/game/storage.ts`

```ts
import type { GameState } from './reducer'

// Bump the version whenever GameState changes shape, so an old save is ignored
// instead of crashing the new code.
const SAVED_GAME_KEY = 'five-dice:saved-game:v1'

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(state))
}

/** The saved game, or null if there is none or it can't be read. */
export function loadGame(): GameState | null {
  const json = localStorage.getItem(SAVED_GAME_KEY)
  if (json === null) return null
  try {
    const data: unknown = JSON.parse(json)
    // Anything could be in storage: check the shape before trusting it.
    if (isGameState(data)) return data
  } catch {
    // Not valid JSON: fall through.
  }
  return null
}

export function clearSavedGame(): void {
  localStorage.removeItem(SAVED_GAME_KEY)
}

function isGameState(data: unknown): data is GameState {
  if (typeof data !== 'object' || data === null) return false
  const state = data as Partial<GameState>
  return (
    Array.isArray(state.players) &&
    state.players.length > 0 &&
    Array.isArray(state.dice) &&
    state.dice.length === 5 &&
    typeof state.current === 'number' &&
    typeof state.rollsLeft === 'number' &&
    typeof state.settings === 'object'
  )
}
```

- `GameState` is plain data (arrays, objects, numbers, strings, booleans), so `JSON.stringify` saves it and `JSON.parse` returns an equal object: one more payoff of serialisable state.
- `JSON.parse` returns `any`; `unknown` plus the type predicate `isGameState` forces a check before use ([TypeScript Crash Course, chapter 5](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/05-unions-and-narrowing.md#type-predicates)). It checks enough of the shape to catch old or broken saves, not every field. The version in the key handles planned changes.
- `JSON.parse` throws on invalid text, hence the `try`. `catch {}` without a variable is fine when you don't need the error.

A test for the round trip and for bad data, in `src/game/storage.test.ts`:

`src/game/storage.test.ts`

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { createGame } from './reducer'
import { clearSavedGame, loadGame, saveGame } from './storage'

describe('storage', () => {
  afterEach(() => localStorage.clear())

  it('saves and loads a game', () => {
    const game = createGame({ playerNames: ['Ada'], settings: { fiveOfAKindBonus: true } })
    saveGame(game)
    expect(loadGame()).toEqual(game)
    clearSavedGame()
    expect(loadGame()).toBeNull()
  })

  it('ignores data it cannot use', () => {
    localStorage.setItem('five-dice:saved-game:v1', '{ not json')
    expect(loadGame()).toBeNull()
    localStorage.setItem('five-dice:saved-game:v1', '{"players": []}')
    expect(loadGame()).toBeNull()
  })
})
```

jsdom implements `localStorage`, so no stubs are needed. Storage persists between tests in a file, so each test cleans up.

### The reducer: `setupOf`

A resumed game needs its `GameSetup` back (for **Play again**). Add this function to `src/game/reducer.ts`, right after `createGame`:

`src/game/reducer.ts`

```ts
/** The players and options a game was started with. */
export function setupOf(state: GameState): GameSetup {
  return { playerNames: state.players.map((player) => player.name), settings: state.settings }
}
```

### `App`: resume on start, forget on "New game"

`src/App.tsx`

```tsx
import { useState } from 'react'
import { Game } from './components/Game'
import { GameProvider } from './components/GameProvider'
import { NewGameForm } from './components/NewGameForm'
import { setupOf, type GameState } from './game/reducer'
import { clearSavedGame, loadGame } from './game/storage'
import type { GameSetup } from './game/types'

/** One game from start to finish. A new id means a brand-new game. */
interface Session {
  id: number
  setup: GameSetup
  /** Set when continuing a game saved in localStorage. */
  saved?: GameState
}

/** Continue the saved game, if there is one. */
function resumeSession(): Session | null {
  const saved = loadGame()
  return saved ? { id: 1, setup: setupOf(saved), saved } : null
}

function App() {
  // null shows the new-game form. The initializer function reads localStorage
  // once, on the first render, instead of on every render.
  const [session, setSession] = useState(resumeSession)

  function handlePlayAgain() {
    // Same players and options, new id. The new `key` below makes React throw
    // away the old <GameProvider> and its state, and mount a fresh one.
    setSession((current) => current && { id: current.id + 1, setup: current.setup })
  }

  function handleNewGame() {
    // The player chose to abandon this game: logic for one specific event
    // belongs in its event handler, not in an Effect.
    clearSavedGame()
    setSession(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Five Dice</h1>
        {session && (
          <button type="button" onClick={handleNewGame}>
            New game
          </button>
        )}
      </header>

      {session ? (
        <GameProvider key={session.id} setup={session.setup} saved={session.saved}>
          <Game onPlayAgain={handlePlayAgain} />
        </GameProvider>
      ) : (
        <main className="setup">
          <h2>New game</h2>
          <NewGameForm onStart={(setup) => setSession({ id: 1, setup })} />
        </main>
      )}

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

- `useState(resumeSession)` passes the function itself, which React calls on the first render only. A saved game starts straight away, with no flash of the form. TypeScript infers `Session | null` from the function's return type.
- `handleNewGame` clears the save. Not a cleanup when `GameProvider` unmounts: cleanups also run for reasons unrelated to abandoning a game (Strict Mode's test unmount, **Play again** replacing the provider). Only the click handler knows the player gave up.

### `GameProvider`: save after every change

`src/components/GameProvider.tsx`

```tsx
import { useEffect, useReducer, type ReactNode } from 'react'
import { createGame, gameReducer, getPhase, type GameState } from '../game/reducer'
import { clearSavedGame, saveGame } from '../game/storage'
import type { GameSetup } from '../game/types'
import { GameDispatchContext, GameStateContext } from './contexts'

interface GameProviderProps {
  setup: GameSetup
  /** A saved game to continue instead of starting a new one. */
  saved?: GameState
  children: ReactNode
}

/** Owns the game state and shares it with every component below it. */
export function GameProvider({ setup, saved, children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, null, () => saved ?? createGame(setup))

  // Keep localStorage in sync with the game: an external system, so an Effect.
  // It runs after every render where `state` changed.
  useEffect(() => {
    if (getPhase(state) === 'gameOver') {
      clearSavedGame() // nothing left to resume
    } else {
      saveGame(state)
    }
  }, [state])

  // React 19: a context object itself is the provider (no more <Context.Provider>).
  return (
    <GameStateContext value={state}>
      <GameDispatchContext value={dispatch}>{children}</GameDispatchContext>
    </GameStateContext>
  )
}
```

- `useReducer(reducer, initialArg, init)` calls `init(initialArg)` once for the first state. Chapter 10 passed `setup` and `createGame`. The initializer now needs `saved` and `setup`, so it ignores its argument (`null`) and reads both from the closure.
- The save Effect is the textbook case: "storage always holds the current game", whichever action changed it. The reducer returns the *same* object when an action changes nothing ([Chapter 7](07-reducers.md)), so ignored actions don't save.
- No cleanup needed: saving the same state twice (as Strict Mode does) gives the same result.

### `Game`: the tab title

The title is *derived* from state, so it's computed during render like any text; only writing it to `document.title` needs an Effect. Change the top of `src/components/Game.tsx`:

`src/components/Game.tsx`

```tsx
import { useContext, useEffect } from 'react'
import { getPhase } from '../game/reducer'
import { CATEGORIES } from '../game/rules'
import { DiceTray } from './DiceTray'
import { GameOver } from './GameOver'
import { Panel } from './Panel'
import { Scoreboard } from './Scoreboard'
import { Scorecard } from './Scorecard'
import { GameStateContext } from './contexts'

interface GameProps {
  onPlayAgain: () => void
}

/** Lays out the board. The pieces read the game from context themselves. */
export function Game({ onPlayAgain }: GameProps) {
  const state = useContext(GameStateContext)
  if (!state) throw new Error('Game must be used inside <GameProvider>')

  const phase = getPhase(state)
  const player = state.players[state.current]
  const turn = Object.keys(player.sheet.scores).length + 1
  const title =
    phase === 'gameOver'
      ? 'Game over · Five Dice'
      : `${player.name} · turn ${turn}/${CATEGORIES.length} · Five Dice`

  // The browser tab's title lives outside React: synchronise it with an Effect.
  useEffect(() => {
    document.title = title
    // Cleanup runs before the next sync and when Game unmounts.
    return () => {
      document.title = 'Five Dice'
    }
  }, [title])

  return (
```

The `return (` and the JSX below it don't change.

- The turn number is the current player's filled categories plus one.
- The Effect depends on the *string* `title`, not `state`. Rolling or holding changes `state` but not the title, so the Effect doesn't run.
- The cleanup restores `Five Dice` (the `index.html` title), so the tab stops naming a player after you leave the game.

### `DiceTray`: keyboard shortcuts

`DiceTray` is on screen exactly when keyboard play makes sense, so it owns the listener. The new `src/components/DiceTray.tsx`:

`src/components/DiceTray.tsx`

```tsx
import { useContext, useEffect, useEffectEvent } from 'react'
import { rollDice } from '../game/dice'
import { getPhase, type Phase } from '../game/reducer'
import { Die } from './Die'
import { GameDispatchContext, GameStateContext, RngContext } from './contexts'

const HINTS: Record<Phase, string> = {
  ready: 'Roll to start your turn.',
  rolling: 'Click a die to hold it, roll again, or pick a score.',
  mustScore: 'No rolls left: pick a score.',
  gameOver: 'Game over.',
}

export function DiceTray() {
  // No props: everything comes from context.
  const state = useContext(GameStateContext)
  const dispatch = useContext(GameDispatchContext)
  const rng = useContext(RngContext)
  if (!state || !dispatch) throw new Error('DiceTray must be used inside <GameProvider>')

  const phase = getPhase(state)
  const canRoll = phase === 'ready' || phase === 'rolling'

  // An arrow function, not `function roll()`: TypeScript keeps the null check
  // on `dispatch` above for arrow functions, but not for hoisted declarations.
  const roll = () => dispatch({ type: 'roll', values: rollDice(rng) })

  // An Effect Event: called from the Effect below, but always sees the
  // latest render's values (phase, canRoll, …) without being a dependency.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
    // Leave typing in form fields alone.
    if (event.target instanceof Element && event.target.closest('input, select, textarea')) return

    if (event.key === ' ') {
      // Space on a focused button already clicks that button.
      if (event.target instanceof HTMLButtonElement) return
      event.preventDefault() // don't scroll the page
      if (canRoll) roll()
    } else if (['1', '2', '3', '4', '5'].includes(event.key) && phase === 'rolling') {
      dispatch({ type: 'toggleHold', id: Number(event.key) - 1 })
    }
  })

  // Subscribe once on mount, unsubscribe on unmount (and in between when
  // Strict Mode mounts twice in development).
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="dice-area">
      <div className="dice-tray">
        {state.dice.map((die) => (
          <Die
            key={die.id}
            value={die.value}
            held={die.held}
            disabled={phase !== 'rolling'}
            onToggle={() => dispatch({ type: 'toggleHold', id: die.id })}
          />
        ))}
      </div>

      <div className="roll-row">
        <button
          type="button"
          className="roll-button"
          onClick={roll}
          disabled={!canRoll}
        >
          Roll
        </button>
        <p>
          {HINTS[phase]} Rolls left: {state.rollsLeft}
        </p>
      </div>
      <p className="hint">Keyboard: Space rolls, 1–5 hold dice.</p>
    </div>
  )
}
```

- The Roll button and Space share `roll`, so they can't drift apart.
- `roll` is an arrow function so the null check on `dispatch` still applies inside it; a hoisted `function roll() {}` loses it ([TypeScript Crash Course, chapter 5](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/05-unions-and-narrowing.md#narrowing-and-callbacks)).
- `onKeyDown` reads the latest `phase`, `canRoll` and `state` through `useEffectEvent`. The Effect has `[]`: one subscription for the tray's life.
- Guards come first:
  - `event.repeat`: otherwise holding Space would use up all the rolls at once.
  - Modifier keys: Ctrl+1 switches browser tabs and mustn't also hold a die.
  - Form fields: a `window` listener sees *every* key, including typing. The board has no text fields yet, but this keeps future ones (and other pages' fields, if the tray is reused) safe.
- Die ids are 0–4, so key `'3'` toggles die id 2.

### Gotcha: Space on a focused button

Space on a focused button clicks it; that's how keyboard users press buttons. The `keydown` also bubbles to `window`, where this handler sees it. Without the `HTMLButtonElement` check, the handler calls `preventDefault()` (cancelling the button's click) and rolls: Tab to a die, press Space to hold it, and the dice roll instead. With the check, the focused button does its job and the handler stays out of the way.

### Styles

Append to `src/index.css`:

```css
.hint {
  color: var(--color-muted);
  font-size: 0.875rem;
}
```

### Tests

The tests now leave saved games behind. Add one line to the `afterEach` in `src/test/setup.ts`:

`src/test/setup.ts`

```ts
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
// Adds DOM matchers such as toBeInTheDocument() and toBeDisabled() to expect().
import '@testing-library/jest-dom/vitest'

// Unmount whatever a test rendered, so the next test starts with an empty page.
// (Testing Library does this by itself only when Vitest's `globals` option is on.)
afterEach(() => {
  cleanup()
  // Saved games must not leak from one test into the next.
  localStorage.clear()
})
```

Otherwise the next test would resume the previous test's game instead of seeing the new-game form.

In `src/App.test.tsx`, import `cleanup` too:

```tsx
import { cleanup, render, screen, within } from '@testing-library/react'
```

Then add three tests at the end of the `describe('App', …)` block:

```tsx
  it('can be played with the keyboard', async () => {
    const user = await startGame(fakeDice(1, 2, 3, 4, 5, 6))

    await user.keyboard(' ') // Space rolls
    expect(screen.getByText(/Rolls left: 2/)).toBeInTheDocument()
    await user.keyboard('1') // 1–5 hold a die
    expect(screen.getByRole('button', { name: 'Die showing 1' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows whose turn it is in the tab title', async () => {
    const user = await startGame(fakeDice(6))
    expect(document.title).toBe('Player 1 · turn 1/13 · Five Dice')
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(scoreButton('Chance'))
    expect(document.title).toBe('Player 1 · turn 2/13 · Five Dice')
  })

  it('resumes a saved game after a reload', async () => {
    const user = await startGame(fakeDice(6))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(scoreButton('Sixes'))

    // Unmount and mount again: like closing the tab and coming back.
    cleanup()
    renderApp()
    expect(screen.getByRole('row', { name: 'Sixes 30' })).toBeInTheDocument()

    // "New game" forgets the saved game.
    await user.click(screen.getByRole('button', { name: 'New game' }))
    cleanup()
    renderApp()
    expect(screen.getByRole('heading', { name: 'New game' })).toBeInTheDocument()
  })
```

- `user.keyboard(' ')` types into whatever has focus. After **Start game** the form is gone, so focus is on `<body>` and the event bubbles to the `window` listener.
- The title test reads `document.title` directly; jsdom implements it.
- `cleanup()` mid-test unmounts everything, like closing the tab. `localStorage` survives, so the next `renderApp()` resumes the game: the whole feature in one test.

### See Strict Mode in action

To watch Strict Mode in the real app, add temporary logs. In `DiceTray`, after `const canRoll = …`, add:

```tsx
  console.log('render DiceTray, rolls left:', state.rollsLeft)
```

and change its Effect to:

```tsx
  useEffect(() => {
    console.log('subscribe keydown')
    window.addEventListener('keydown', onKeyDown)
    return () => {
      console.log('unsubscribe keydown')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])
```

In `Game`, change the title Effect to:

```tsx
  useEffect(() => {
    console.log('set title:', title)
    document.title = title
    // Cleanup runs before the next sync and when Game unmounts.
    return () => {
      console.log('reset title, was:', title)
      document.title = 'Five Dice'
    }
  }, [title])
```

Run `npm run dev`, open the console, click **Start game**, then **Roll**, then **New game**. (The `----` lines mark the clicks.)

```text
render DiceTray, rolls left: 3
render DiceTray, rolls left: 3
subscribe keydown
set title: Player 1 · turn 1/13 · Five Dice
reset title, was: Player 1 · turn 1/13 · Five Dice
unsubscribe keydown
subscribe keydown
set title: Player 1 · turn 1/13 · Five Dice
----- click Roll -----
render DiceTray, rolls left: 2
render DiceTray, rolls left: 2
----- click New game -----
reset title, was: Player 1 · turn 1/13 · Five Dice
unsubscribe keydown
```

- Every render happens twice: Strict Mode's render check ([Chapter 4](04-components-and-jsx.md)). The two lines may look identical in the console.
- Effects run after the render, children first: `DiceTray`'s subscribe comes before `Game`'s title.
- Then Strict Mode unmounts and mounts once: every cleanup runs, then every setup again.
- **Roll** changes state, but neither Effect runs: the title string is unchanged, and `[]` never changes.
- **New game** unmounts the board: both cleanups run.

Build and run the production version (`npm run build`, then `npm run preview`, which serves it at `http://localhost:4173/`) and repeat the clicks: each line appears once. Strict Mode costs nothing in production. Remove the logs afterwards.

### Checkpoint

The checks, trimmed to the lines that matter:

```console
$ npm test
…
 ✓ src/game/storage.test.ts (2 tests) 5ms
…
 ✓ src/App.test.tsx (12 tests) 2630ms
   ✓ App (12)
     ✓ plays 13 turns to the end and starts again 537ms
     ✓ announces a tie when players finish level 1301ms

 Test Files  8 passed (8)
      Tests  71 passed (71)

$ npm run build
…
✓ 31 modules transformed.
…
$ npm run lint
…
Found 0 warnings and 0 errors.
```

Timings vary. Vitest lists slow tests under their file.

In the browser (`npm run dev`):

- Start a game with Ada and Bo. The tab reads **Ada · turn 1/13 · Five Dice**.
- Press Space: the dice roll and the page doesn't scroll. Press 1 and 3: the first and third dice are held.
- Score something: the tab reads **Bo · turn 1/13 · Five Dice**.
- Reload: the game is still there, on Bo's turn. DevTools' **Application → Local Storage** shows the key `five-dice:saved-game:v1`.
- Click **New game**: the tab goes back to **Five Dice** and the key is gone.

The complete project at this point is in `project/ch11/`.

## Summary

- An **Effect** syncs a component with an **external system** (browser APIs, network, non-React code), after React updates the DOM.
- `useEffect(setup, deps)`: setup starts syncing; the returned **cleanup** stops it, before the next setup and on unmount.
- `[a, b]` re-runs when `a` or `b` changes (`Object.is`); `[]` runs once; no array runs after every render.
- In development, **Strict Mode** runs setup → cleanup → setup on mount. Fix what breaks with a correct cleanup.
- Unlike a vanilla page's listeners, a component's can pile up across mounts: anything setup adds to `window`, `document` or a timer, cleanup removes. Elements you render get JSX event props instead.
- Every reactive value an Effect reads is a dependency; `exhaustive-deps` checks. Remove one by changing the code: an updater function, an object built inside the Effect, or an Effect Event.
- **You might not need an Effect**: derive data during render, put event logic in handlers, reset with a `key`, read initial values with a `useState` initializer.
- Async results race: an `ignore` flag set in cleanup lets only the latest run set state; with `fetch`, cleanup can also `abort()` an `AbortController`.
- With fake timers, `fireEvent` clicks at once; `user-event` needs `shouldAdvanceTime` and `advanceTimers`.
- `useEffectEvent` (stable since React 19.2) reads the latest values inside an Effect without re-running it.
- `useLayoutEffect` runs before paint; use it only to measure layout.
- `localStorage` stores strings: `JSON.stringify` in, `JSON.parse` plus a type guard out.

## Exercises

1. **Release all dice.** Make the key `0` release every held die while rolling. Add a test to `App.test.tsx` that rolls, holds two dice with the keyboard, presses `0`, and checks that no die is held.

<details><summary>Solution</summary>

In `DiceTray`'s `onKeyDown`, add a branch after the `1`–`5` one:

```tsx
    } else if (['1', '2', '3', '4', '5'].includes(event.key) && phase === 'rolling') {
      dispatch({ type: 'toggleHold', id: Number(event.key) - 1 })
    } else if (event.key === '0' && phase === 'rolling') {
      for (const die of state.dice) {
        if (die.held) dispatch({ type: 'toggleHold', id: die.id })
      }
    }
```

The test:

```tsx
  it('releases every die with 0', async () => {
    const user = await startGame(fakeDice(1, 2, 3, 4, 5, 6))
    await user.keyboard(' 13')
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(2)
    await user.keyboard('0')
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
  })
```

The Effect is unchanged: `onKeyDown` is an Effect Event, so the new branch sees the latest `state` with no new dependency. `{ pressed: true }` matches buttons with `aria-pressed="true"`.

</details>

2. **Offline notice.** The browser fires `online` and `offline` events on `window`, and `navigator.onLine` gives the current state. Write an `OfflineNotice` component that shows "You're offline. The game still works and is saved on this device." while offline, and nothing otherwise. Test it by faking `navigator.onLine` with `vi.spyOn(navigator, 'onLine', 'get')` and dispatching the events.

<details><summary>Solution</summary>

`src/components/OfflineNotice.tsx`:

```tsx
import { useEffect, useState } from 'react'

export function OfflineNotice() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    // One function for both events: read the current value from the browser.
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (online) return null
  return <p className="hint">You're offline. The game still works and is saved on this device.</p>
}
```

`src/components/OfflineNotice.test.tsx`:

```tsx
import { act, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { OfflineNotice } from './OfflineNotice'

it('shows a notice while offline', () => {
  render(<OfflineNotice />)
  expect(screen.queryByText(/offline/)).not.toBeInTheDocument()

  const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  act(() => window.dispatchEvent(new Event('offline')))
  expect(screen.getByText(/You're offline/)).toBeInTheDocument()

  onLine.mockReturnValue(true)
  act(() => window.dispatchEvent(new Event('online')))
  expect(screen.queryByText(/offline/)).not.toBeInTheDocument()
})
```

Setting state inside a listener isn't a direct `setState` in the Effect body, so the `set-state-in-effect` rule stays quiet. Hand-dispatched events need `act()`. [Chapter 13](13-custom-hooks.md) shows `useSyncExternalStore`, a Hook made for this kind of browser value.

</details>

3. **Find the bug.** This button copies the final score to the clipboard. A player clicks it at 180 points; later the score changes to 200. What happens, and why? Fix it.

```tsx
export function ShareResult({ score }: { score: number }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (copied) {
      navigator.clipboard.writeText(`I scored ${score} in Five Dice!`)
    }
  }, [copied, score])

  return (
    <button type="button" onClick={() => setCopied(true)}>
      {copied ? 'Copied!' : 'Copy result'}
    </button>
  )
}
```

<details><summary>Solution</summary>

When `score` changes, the Effect re-runs. `copied` is still `true`, so it copies again, with no click, overwriting whatever the player copied since. Copying is caused by one event, the click, so it belongs in the click handler:

```tsx
export function ShareResult({ score }: { score: number }) {
  const [copied, setCopied] = useState(false)

  function handleClick() {
    navigator.clipboard.writeText(`I scored ${score} in Five Dice!`)
    setCopied(true)
  }

  return (
    <button type="button" onClick={handleClick}>
      {copied ? 'Copied!' : 'Copy result'}
    </button>
  )
}
```

A test proves it. `userEvent.setup()` gives `navigator` a fake clipboard to spy on:

```tsx
it('copies once per click', async () => {
  const user = userEvent.setup()
  const writeText = vi.spyOn(navigator.clipboard, 'writeText')
  const { rerender } = render(<ShareResult score={180} />)
  await user.click(screen.getByRole('button', { name: 'Copy result' }))
  rerender(<ShareResult score={200} />)
  expect(writeText.mock.calls).toEqual([['I scored 180 in Five Dice!']])
})
```

With the Effect version, `writeText.mock.calls` is `[['I scored 180 in Five Dice!'], ['I scored 200 in Five Dice!']]`.

</details>

4. **Predict Strict Mode.** How many times does `GameProvider` write to `localStorage` on mount in development? In production? Is that a problem? Check with a test that spies on `Storage.prototype.setItem` and renders `GameProvider` with and without `{ reactStrictMode: true }`.

<details><summary>Solution</summary>

Twice in development (setup, no cleanup, setup), once in production. Harmless: the second write stores the same JSON. An Effect whose setup gives the same result twice in a row needs no cleanup.

`src/components/GameProvider.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { GameProvider } from './GameProvider'

it.each([
  [false, 1],
  [true, 2],
])('saves on mount (Strict Mode %s)', (strict, writes) => {
  const setItem = vi.spyOn(Storage.prototype, 'setItem')
  const setup = { playerNames: ['Ada'], settings: { fiveOfAKindBonus: true } }
  render(
    <GameProvider setup={setup}>
      <p>Board</p>
    </GameProvider>,
    { reactStrictMode: strict },
  )
  expect(setItem).toHaveBeenCalledTimes(writes)
})
```

`localStorage.setItem` is a method inherited from `Storage.prototype`, so that's where you spy.

</details>

Sources for this chapter: [REFERENCES.md](REFERENCES.md#chapter-11--effects)
