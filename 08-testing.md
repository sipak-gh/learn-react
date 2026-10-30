# Chapter 8 — Testing

Clicking through 13 turns after every change doesn't scale. This chapter automates it: Vitest runs component
tests in Node with a simulated browser, and Testing Library finds elements the way a user does (roles,
labels, text). You simulate clicks and typing, wait for async updates, make random dice predictable, mock
modules and `fetch`, and meet snapshots and coverage. The project gets tests for the [Chapter 7](07-reducers.md) reducer and the whole app,
and an `npm test` script. [Chapter 9](09-forms.md) adds a form and its tests.

## Testing like a user

[Chapter 3](03-javascript-for-react.md) tested pure functions: call, compare, done. Components render DOM,
react to events and change over time. You could test their internals (state, props passed to children), but
those tests break on every refactor, even when the app still works.

Chapter 7 replaced three `useState` calls with one `useReducer`. A user sees no difference. "Click Roll, see
new dice" passes before and after; "the `rollsLeft` state is 2" breaks.

Testing Library's guiding rule:

> The more your tests resemble the way your software is used, the more confidence they can give you.

In practice:

- **Find elements as a user does**: a button by its text, an input by its label, a heading by its name; not
  by CSS class or component name.
- **Interact** by clicking, typing, pressing keys.
- **Check what a user sees**: text, enabled and disabled buttons, checked boxes.

Bonus: if a test can't find a button by its accessible name, neither can a screen-reader user. Good tests
push you toward accessible markup ([Chapter 15](15-accessibility.md)).

### The tools

| Tool | Job |
|---|---|
| **Vitest** | Test runner: finds `*.test.ts(x)` files, runs them, reports. From Chapter 3. |
| **jsdom** | A browser DOM written in JavaScript. Gives Node a `document` and `window`. |
| **@testing-library/react** | `render()` puts a component into jsdom's `document`. Re-exports the queries. |
| **@testing-library/dom** | The queries (`getByRole` …) and `waitFor`. Framework-independent. |
| **@testing-library/user-event** | Simulates a user: full click, typing and keyboard sequences. |
| **@testing-library/jest-dom** | Extra `expect` matchers for the DOM: `toBeInTheDocument()`, `toBeDisabled()` … |

jsdom is not a real browser. It has no layout and no painting: elements have no size and nothing is drawn.
It is precise enough for most UI logic and much faster than a browser. Check layout, styling and focus
outlines in a real browser.

When you need a real browser in tests, there are two common options. **Vitest Browser Mode** runs these same
component tests in Chromium, Firefox or WebKit. **Playwright** drives the whole built app end to end. Both
are slower and need browser binaries, so this course stays with jsdom.

### How the pieces fit

The `examples` app is already set up. Vitest reads the `test` block in its `vite.config.ts`:

`examples/vite.config.ts`
```ts
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
  },
})
```

- `environment: 'jsdom'` gives each test file a fresh simulated browser. The default, `'node'`, has no
  `document`.
- `setupFiles` run before each test file.
- The `/// <reference …>` line tells TypeScript that `defineConfig` accepts `test`.

`examples/test-setup.ts`
```ts
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})
```

- Importing `@testing-library/jest-dom/vitest` adds the DOM matchers (and their types) to Vitest's `expect`.
- `cleanup()` unmounts everything a test rendered. Testing Library registers it itself only if the runner
  has a *global* `afterEach`. Vitest doesn't unless you enable its `globals` option, so the course calls it
  explicitly. The project section shows what happens without it.

## A first component test

This coin gets its random numbers from an `rng` prop that defaults to `Math.random`, the same trick as
`rollDie(rng)` in [Chapter 3](03-javascript-for-react.md):

`examples/ch08/coin.demo.tsx`
```tsx
import { useState } from 'react'

type Side = 'Heads' | 'Tails'

interface CoinProps {
  /** Returns a number in [0, 1), like Math.random. Tests pass a fake. */
  rng?: () => number
}

export default function Coin({ rng = Math.random }: CoinProps) {
  const [sides, setSides] = useState<Side[]>([])

  function flip() {
    const side: Side = rng() < 0.5 ? 'Heads' : 'Tails'
    setSides([...sides, side])
  }

  const last = sides.at(-1)
  return (
    <main>
      <h1>Coin flip</h1>
      <p role="status">{last ?? 'Not flipped yet'}</p>
      <p>Flips: {sides.length}</p>
      <button type="button" onClick={flip}>
        Flip
      </button>
      {sides.length > 0 && (
        <button type="button" onClick={() => setSides([])}>
          Reset
        </button>
      )}
    </main>
  )
}
```

`role="status"` tells assistive technology this paragraph shows a status message, and gives the test a role
to find.

`examples/ch08/coin.test.tsx`
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import Coin from './coin.demo'

/** A fake rng that returns the given numbers in order. */
function fakeRng(...values: number[]) {
  return () => {
    const next = values.shift()
    if (next === undefined) throw new Error('fakeRng ran out of values')
    return next
  }
}

describe('Coin', () => {
  it('starts without a result and without a Reset button', () => {
    render(<Coin />)

    expect(screen.getByRole('heading', { name: 'Coin flip' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Not flipped yet')
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument()
  })

  it('shows the side that the rng picks', async () => {
    const user = userEvent.setup()
    render(<Coin rng={fakeRng(0.1, 0.9)} />)

    await user.click(screen.getByRole('button', { name: 'Flip' }))
    expect(screen.getByRole('status')).toHaveTextContent('Heads')

    await user.click(screen.getByRole('button', { name: 'Flip' }))
    expect(screen.getByRole('status')).toHaveTextContent('Tails')
    expect(screen.getByText('Flips: 2')).toBeInTheDocument()
  })

  it('starts again after Reset', async () => {
    const user = userEvent.setup()
    render(<Coin rng={fakeRng(0.7)} />)

    await user.click(screen.getByRole('button', { name: 'Flip' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(screen.getByRole('status')).toHaveTextContent('Not flipped yet')
    expect(screen.getByText('Flips: 0')).toBeInTheDocument()
  })

  it('renders this markup after one flip', async () => {
    const user = userEvent.setup()
    const { container } = render(<Coin rng={fakeRng(0.2)} />)

    await user.click(screen.getByRole('button', { name: 'Flip' }))
    expect(container.innerHTML).toMatchInlineSnapshot(`"<main><h1>Coin flip</h1><p role="status">Heads</p><p>Flips: 1</p><button type="button">Flip</button><button type="button">Reset</button></main>"`)
  })
})
```

Run it from the `examples` folder (your times will differ):

```console
$ npx vitest run ch08/coin

 RUN  v5.0.5 /home/you/learn-react/examples

 ✓ ch08/coin.test.tsx (4 tests) 175ms

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  16:22:16
   Duration  695ms (environment 56%, tests 28%, setup 9%, import 5%, transform 2%)
```

Arguments after `vitest run` filter by file path, so `ch08/coin` runs only this file. "environment" is the
time spent creating jsdom.

- **`render(<Coin />)`** mounts the component into a `<div>` in jsdom's `document.body` and returns helpers,
  including `container` (that `<div>`).
- **`screen`** has every query, bound to `document.body`. Prefer it to `render`'s helpers: it reads like
  "look at the screen".
- **The fake rng** makes the test deterministic: `0.1` is heads, `0.9` tails. It throws if asked for more
  numbers than expected, which catches a component that flips twice per click.
- **The last test** is a snapshot test; see [Snapshot tests](#snapshot-tests).

### Queries

Every query has a *variant* and a *kind*. The variant decides what happens when the element is missing:

| Variant | No match | One match | Several matches | Use for |
|---|---|---|---|---|
| `getBy…` | throws | returns it | throws | Elements that must be there now |
| `queryBy…` | returns `null` | returns it | throws | Checking that something is **not** there |
| `findBy…` | rejects after a timeout | resolves to it | rejects | Elements that appear later (async) |
| `getAllBy…`, `queryAllBy…`, `findAllBy…` | like above, but return arrays | | | Lists |

The kind decides how to find it. Testing Library's recommended order:

1. **`ByRole`**, usually with `{ name }`: `getByRole('button', { name: 'Flip' })`. The role comes from the
   element (`<button>` is `button`, `<h1>` `heading`, `<input type="checkbox">` `checkbox`) or a `role`
   attribute. The *accessible name* is what a screen reader announces: button text, input label,
   `aria-label`.
2. **`ByLabelText`**: form fields by label ([Chapter 9](09-forms.md)).
3. **`ByPlaceholderText`**, **`ByText`**, **`ByDisplayValue`**: when there is no better handle.
   `getByText('Flips: 2')` finds non-interactive text.
4. **`ByAltText`**, **`ByTitle`**: images and tooltips.
5. **`ByTestId`**: a `data-testid` attribute users can't see. Last resort; this course never uses it.

`name` and text match the whole string by default. Use a regular expression for a partial match:
`getByRole('row', { name: /^Chance/ })`.

### When a query fails

A failed `getBy…` prints what *is* there. Try a throwaway test in a file like `ch08/zz-fail.test.tsx` that
asks for a button named "Flip coin":

```tsx
it('wrong name', () => {
  render(<Coin />)
  screen.getByRole('button', { name: 'Flip coin' })
})
```

The start of the output:

```text
 FAIL  ch08/zz-fail.test.tsx > wrong name
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Flip coin"

Here are the accessible roles:

  main:

  Name "":
  <main />

  --------------------------------------------------
  heading:

  Name "Coin flip":
  <h1 />

  --------------------------------------------------
  status:

  Name "":
  <p
    role="status"
  />

  --------------------------------------------------
  paragraph:

  Name "":
  <p />

  --------------------------------------------------
  button:

  Name "Flip":
  <button
    type="button"
  />

  --------------------------------------------------

Ignored nodes: comments, script, style
<body>
  …the rendered HTML, pretty-printed…
</body>
```

This list is the fastest way to fix a query, and a quick accessibility review: an input with `Name ""` has
no label.

`screen.debug()` prints the same pretty HTML at any point. Here after one flip:

```text
stdout | ch08/zz-fail.test.tsx > debug
<body>
  <div>
    <main>
      <h1>
        Coin flip
      </h1>
      <p
        role="status"
      >
        Heads
      </p>
      …
```

### jest-dom matchers

The setup file added matchers that read like a person's checks:

| Matcher | Passes when |
|---|---|
| `toBeInTheDocument()` | The element is attached to the document |
| `toHaveTextContent(text)` | Its text contains `text` (a string) or matches (a regex) |
| `toBeDisabled()`, `toBeEnabled()` | Form control state |
| `toBeChecked()` | A checkbox or radio is checked |
| `toHaveValue(value)` | An input, select or textarea has this value |
| `toHaveAttribute(name, value?)` | The attribute exists (with this value) |
| `toContainElement(el)` | `el` is a descendant |
| `toHaveAccessibleDescription(text)` | Its `aria-describedby` text matches |

With `queryBy…` they express absence: `expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument()`.
`getBy…` would throw before `expect` runs.

## Simulating the user with `user-event`

`userEvent.setup()` creates a simulated user whose methods return promises:

```tsx
const user = userEvent.setup()
await user.click(button)
await user.type(input, 'Ada')
await user.clear(input)
await user.keyboard('{Enter}')
await user.selectOptions(select, 'pro')
```

- `click` fires the full sequence of a real click: `pointerdown`, `mousedown`, focus, `pointerup`, `mouseup`,
  `click`. It also checks that a user *could* do it: it won't type into a disabled text box, for example.
- `type` clicks the element, then presses each key (`keydown`, `keypress`, `input`, `keyup`), so a controlled
  input sees one `onChange` per character.
- Call `setup()` at the start of each test, before `render`. The user-event docs discourage rendering or
  using `userEvent` in hooks like `beforeEach`: keep each test self-contained.

`fireEvent.click(button)` dispatches one single DOM event. It is lower level and skips checks a user would
hit. Prefer `user-event`.

### Always `await`

Forget an `await` and the check runs before React has handled the click:

```tsx
it('no await click', () => {
  const user = userEvent.setup()
  render(<Coin rng={() => 0.2} />)
  user.click(screen.getByRole('button', { name: 'Flip' }))
  expect(screen.getByRole('status')).toHaveTextContent('Heads')
})
```

```text
 FAIL  ch08/zz-fail.test.tsx > no await click
Error: expect(element).toHaveTextContent()

Expected element to have text content:
  Heads
Received:
  Not flipped yet
```

The test function must be `async`. If a test fails showing the *old* screen, look for a missing `await`
first.

## Async code: `findBy` and `waitFor`

Many updates follow a promise: a server answers, a timer fires. This form asks a fake server whether a user
name is free. The server is a prop, so tests can replace it:

`examples/ch08/name-check.demo.tsx`
```tsx
import { useState, type FormEvent } from 'react'

type Status = 'idle' | 'checking' | 'available' | 'taken'

interface NameCheckProps {
  /** Asks a server whether the name is free. Tests pass a fake. */
  checkName?: (name: string) => Promise<boolean>
}

const TAKEN = ['ada', 'bo']

// Pretends to be a server that needs half a second to answer.
function fakeServer(name: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(!TAKEN.includes(name.toLowerCase())), 500)
  })
}

export default function NameCheck({ checkName = fakeServer }: NameCheckProps) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('checking')
    const free = await checkName(name)
    setStatus(free ? 'available' : 'taken')
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        User name{' '}
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setStatus('idle')
          }}
        />
      </label>{' '}
      <button type="submit" disabled={name === '' || status === 'checking'}>
        Check
      </button>
      {status === 'checking' && <p>Checking…</p>}
      {status === 'available' && <p>{name} is available.</p>}
      {status === 'taken' && <p>{name} is taken.</p>}
    </form>
  )
}
```

[Chapter 9](09-forms.md) explains `onSubmit` and `event.preventDefault()`; for now, Enter or Check calls
`handleSubmit`. Open `?demo=ch08/name-check` and try "Ada" and "Cy".

The answer doesn't appear right away. A plain `getByText` right after the click fails, showing the screen at
that moment:

```text
 FAIL  ch08/zz-fail.test.tsx > getBy for slow server
TestingLibraryElementError: Unable to find an element with the text: Bo is taken.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <form>
      …
      <p>
        Checking…
      </p>
    </form>
  </div>
</body>
```

Two tools for this:

- **`await screen.findByText(…)`** (any `findBy…`) retries the query until it matches or times out.
- **`await waitFor(() => { … })`** retries a callback until it stops throwing. Use it for checks that aren't
  a single query.

Both check immediately, then every 50 ms, for up to 1000 ms by default. Both need `await`.

`examples/ch08/name-check.test.tsx`
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import NameCheck from './name-check.demo'

describe('NameCheck', () => {
  it('asks the server and shows the answer', async () => {
    const user = userEvent.setup()
    const checkName = vi.fn(async () => true)
    render(<NameCheck checkName={checkName} />)

    await user.type(screen.getByLabelText('User name'), 'Cy')
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(await screen.findByText('Cy is available.')).toBeInTheDocument()
    expect(checkName).toHaveBeenCalledExactlyOnceWith('Cy')
  })

  it('shows "Checking…" while it waits', async () => {
    const user = userEvent.setup()
    // A promise that we resolve by hand, so the test controls the timing.
    let answer = (_free: boolean) => {}
    const checkName = () =>
      new Promise<boolean>((resolve) => {
        answer = resolve
      })
    render(<NameCheck checkName={checkName} />)

    await user.type(screen.getByLabelText('User name'), 'Ada')
    await user.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Checking…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled()

    answer(false)
    expect(await screen.findByText('Ada is taken.')).toBeInTheDocument()
    expect(screen.queryByText('Checking…')).not.toBeInTheDocument()
  })

  it('works with the slow default server too', async () => {
    const user = userEvent.setup()
    render(<NameCheck />)

    await user.type(screen.getByLabelText('User name'), 'Bo')
    await user.click(screen.getByRole('button', { name: 'Check' }))

    // findBy* and waitFor retry for up to 1000 ms. The fake server needs 500 ms.
    await waitFor(() => {
      expect(screen.getByText('Bo is taken.')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Check' })).toBeEnabled()
  })
})
```

- **`vi.fn(impl)`** creates a *mock function* that runs `impl` and records every call.
  `toHaveBeenCalledExactlyOnceWith('Cy')` checks for exactly one call with exactly this argument;
  `not.toHaveBeenCalled()` checks for none. Vitest 5 clears recorded calls before every test (`clearMocks` is
  on by default), so calls never leak between tests.
- **The hand-made promise** in the second test decides *when* the server answers: the only reliable way to
  check the in-between state ("Checking…").
- **The third test** uses the real 500 ms fake server. It works but is slow, and anything over 1000 ms would
  fail. Inject a fake whenever you can.

```console
$ npx vitest run ch08

 RUN  v5.0.5 /home/you/learn-react/examples

 ✓ ch08/coin.test.tsx (4 tests) 201ms
 ✓ ch08/name-check.test.tsx (3 tests) 742ms
   ✓ NameCheck (3)
     ✓ works with the slow default server too 530ms

 Test Files  2 passed (2)
      Tests  7 passed (7)
   Start at  16:25:54
   Duration  1.33s (tests 48%, environment 40%, setup 7%, import 3%, transform 1%)
```

Vitest lists tests slower than 300 ms under their file, so you notice them.

### Async assertions must be awaited too

`.resolves` and `.rejects` return a promise. Vitest 5 fails a test that doesn't await them:

```tsx
it('unawaited resolves', async () => {
  expect(Promise.resolve(2)).resolves.toBe(1)
})
```

```text
 FAIL  ch08/zz-fail.test.tsx > unawaited resolves
Error: Promise returned by `expect(actual).resolves.toBe(expected)` was not awaited. This assertion is asynchronous and must be awaited; otherwise, it is not guaranteed to complete before the test finishes:

await expect(actual).resolves.toBe(expected)
```

With `await expect(Promise.resolve(2)).resolves.toBe(1)` it fails for the right reason: `expected 2 to be 1`.
Delete the throwaway file when you're done.

## Controlling randomness

Tests must give the same result every time, so anything random or clock-based must come from outside the
component, where a test can replace it:

- **Pass it as a prop with a real default**, like `Coin`'s `rng = Math.random` and `NameCheck`'s
  `checkName = fakeServer`. The app uses the default; tests pass a fake. It is the same idea as a plain JS
  function parameter with a default value.
- **Use a fake with chosen values**, like `fakeRng(0.1, 0.9)`, for specific outcomes. Use a seeded generator
  (`createSeededRng`, Chapter 3) when the test only needs *repeatable* values.
- **Keep the reducer out of it.** It never calls the rng: dice values arrive in the `roll` action
  ([Chapter 7](07-reducers.md)), so a reducer test just writes the values it wants.

Passing a prop through many layers gets tedious. [Chapter 10](10-composition-and-context.md) moves the rng
into a *context*, and tests provide a fake one around the app.

## Mocking modules and `fetch`

A prop is the simplest seam, but a lot of code imports what it needs directly. This button loads a top score
from a small API module:

`examples/ch08/top-score.ts`
```ts
export interface TopScore {
  name: string
  score: number
}

export async function fetchTopScore(): Promise<TopScore> {
  const response = await fetch('/ch08/top-score.json')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  // Trusts the server. Chapter 11 shows how to check untrusted data.
  return (await response.json()) as TopScore
}
```

`examples/ch08/top-score.demo.tsx`
```tsx
import { useState } from 'react'
import { fetchTopScore, type TopScore } from './top-score'

export default function TopScoreButton() {
  const [top, setTop] = useState<TopScore | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      setTop(await fetchTopScore())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <section>
      <button type="button" onClick={load}>
        Load top score
      </button>
      {top && (
        <p>
          Top score: {top.name}, {top.score}
        </p>
      )}
      {error && <p role="alert">Could not load: {error}</p>}
    </section>
  )
}
```

Open `?demo=ch08/top-score`. The dev server serves `examples/ch08/top-score.json`, so the button shows
"Top score: Ada, 287". In jsdom there is no server, so tests need a replacement. There are two places to cut.

**Replace the module** with `vi.mock(path, factory)`. Every import of `./top-score` in this test file gets the
factory's object instead:

`examples/ch08/top-score.test.tsx`
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { fetchTopScore } from './top-score'
import TopScoreButton from './top-score.demo'

// Replaces the whole module for this test file. Vitest moves this call above the imports.
vi.mock('./top-score', () => ({ fetchTopScore: vi.fn() }))

it('shows the score the API returns', async () => {
  vi.mocked(fetchTopScore).mockResolvedValue({ name: 'Ada', score: 287 })
  const user = userEvent.setup()
  render(<TopScoreButton />)

  await user.click(screen.getByRole('button', { name: 'Load top score' }))

  expect(await screen.findByText('Top score: Ada, 287')).toBeInTheDocument()
  expect(fetchTopScore).toHaveBeenCalledOnce()
})

it('shows an error when the API fails', async () => {
  vi.mocked(fetchTopScore).mockRejectedValue(new Error('HTTP 500'))
  const user = userEvent.setup()
  render(<TopScoreButton />)

  await user.click(screen.getByRole('button', { name: 'Load top score' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load: HTTP 500')
})
```

- **`vi.mock` is hoisted**: Vitest moves it above the `import` lines, so even the component's own import
  gets the fake. Because of that, the factory can't use variables from the rest of the file.
- **`vi.mocked(fn)`** only changes the TypeScript type, to "this is a mock". The value is unchanged.
  `mockResolvedValue` and `mockRejectedValue` choose what the next calls return.
- The mock applies to the whole file. Put tests that need the real module in another file.

**Replace `fetch` itself** to test the API module. `vi.stubGlobal(name, value)` swaps a global such as
`fetch`; `vi.unstubAllGlobals()` restores it:

`examples/ch08/top-score-api.test.ts`
```ts
import { afterEach, expect, it, vi } from 'vitest'
import { fetchTopScore } from './top-score'

afterEach(() => {
  vi.unstubAllGlobals() // put the real fetch back
})

it('reads the JSON', async () => {
  const fetchMock = vi.fn(async () => Response.json({ name: 'Ada', score: 287 }))
  vi.stubGlobal('fetch', fetchMock)

  await expect(fetchTopScore()).resolves.toEqual({ name: 'Ada', score: 287 })
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/ch08/top-score.json')
})

it('throws on an HTTP error', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('Oops', { status: 500 })))

  await expect(fetchTopScore()).rejects.toThrow('HTTP 500')
})
```

`Response.json(data)` builds a real `Response`, the same object `fetch` resolves with. Unlike `clearMocks`,
Vitest's `unstubGlobals` option is off by default, so the `afterEach` matters.

```console
$ npx vitest run ch08/top-score

 Test Files  2 passed (2)
      Tests  4 passed (4)
```

Which seam to choose:

- **A prop** when the component is yours and the dependency is one function. It needs no test machinery.
- **`vi.mock`** when the import is fixed and you want to skip a whole layer.
- **A stubbed `fetch`** to test the code that talks HTTP.

In bigger apps, many teams use **Mock Service Worker (MSW)** instead. It intercepts requests at the network
level with handlers such as "GET `/api/scores` returns this JSON", in tests and in the browser. The code
under test still calls the real `fetch`. MSW isn't installed in the examples.

## Testing reducers

A reducer is a pure function, so its tests need no React, jsdom or `await`. Build a state, apply actions,
check the result:

```ts
function play(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state)
}

it('ignores holding and scoring before the first roll', () => {
  const state = createGame()
  expect(play(state, { type: 'toggleHold', id: 0 })).toBe(state)
})
```

Two matchers, two jobs:

- **`toBe`** compares with `Object.is`: the *same object*. React uses the same check to decide nothing
  changed, so `toBe(state)` proves the reducer ignored the action.
- **`toEqual`** compares structure recursively: "a fresh game looks like `createGame()`".

Reducer tests are fast and cover the rules in detail; slower component tests check that the UI is wired to
them. The project uses both.

## Snapshot tests

The last coin test ends with:

```tsx
expect(container.innerHTML).toMatchInlineSnapshot(`"<main><h1>Coin flip</h1><p role="status">Heads</p>…"`)
```

A *snapshot* is a recorded value. Write `toMatchInlineSnapshot()` with no argument and run the test. Vitest
writes the current value into your test file and reports it:

```text
  Snapshots  1 written
```

From then on the test fails whenever the value differs. To accept a change on purpose, run
`npx vitest run -u` (update) and review the diff in your test file. `toMatchSnapshot()` does the same but
stores the value in a separate `__snapshots__` file.

Snapshots are cheap to write and easy to misuse:

- They check *everything*, so harmless changes break them: a new CSS class, a reordered attribute.
- When a big snapshot breaks, people tend to run `-u` without reading. Then the test checks nothing.
- They don't say what matters. `toHaveTextContent('Heads')` documents intent; a 2 kB HTML string doesn't.

Use them sparingly, for small output that should never change. The project has one: a die's pip layout.
[Chapter 14](14-styling.md) shows it breaking when class names change.

## Coverage

*Coverage* measures which lines and branches ran during the tests. Vitest's `v8` provider uses the counters
built into V8, Node's JavaScript engine. It needs the `@vitest/coverage-v8` package (installed in the project
section). Run with `--coverage`:

```console
$ npx vitest run --coverage
```

Vitest prints a table per file and writes an HTML report, `coverage/index.html`, that highlights lines that
never ran.

Read coverage as a map, not a score:

- **Low coverage is a signal.** An uncovered branch is behaviour no test checks.
- **High coverage is not proof.** A line can run without a test checking its result.
- **100 % is rarely worth it.** Some lines should never run, like the `never` default in `gameReducer`.

## Building five-dice: a test suite

The project gets component tests, reducer tests and three npm scripts. The changes:

- **Install** jsdom, Testing Library, jest-dom and the coverage provider.
- `package.json`: scripts `test`, `test:watch`, `coverage`.
- `vite.config.ts`: a `test` block.
- `.gitignore`: ignore `coverage/`.
- **New** `src/test/setup.ts`.
- `src/App.tsx`: an optional `rng` prop.
- **New** `src/game/reducer.test.ts`, `src/components/Die.test.tsx`, `src/App.test.tsx`.

### Install

In your `five-dice` folder:

```console
$ npm install -D jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom @vitest/coverage-v8
```

`-D` saves them as `devDependencies`: development tools, not part of the app the browser downloads.
`@testing-library/dom` is a peer dependency of `@testing-library/react`; its docs ask you to install it
yourself, so your `package.json` pins its version.

### Scripts

Add three scripts to `package.json`:

`package.json`
```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "coverage": "vitest run --coverage"
  },
```

- `npm test` runs every test once and exits non-zero if one fails, as scripts and CI need. (`test` is one
  of the few scripts that doesn't need `run`.)
- `npm run test:watch` keeps Vitest running and re-runs affected tests on every save. Keep it open in a
  second terminal; press `q` to quit.
- `npm run coverage` adds the coverage report.

### Configure Vitest

`vite.config.ts`
```ts
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vitest reads its settings from the same file: https://vitest.dev/config/
  test: {
    // Simulate a browser (document, window, …) in Node for component tests.
    environment: 'jsdom',
    // Runs before every test file: adds the jest-dom matchers.
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

Tests go through the app's Vite pipeline, so the React plugin compiles their JSX too.

Keep the generated coverage report out of version control. Add to the end of `.gitignore`:

`.gitignore`
```text

# Test coverage reports
coverage
```

### The setup file

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
})
```

Note the path: `@testing-library/jest-dom/vitest`, not `@testing-library/jest-dom`. The `/vitest` entry point
extends Vitest's `expect` and its types.

Without the `afterEach`, each test renders its `App` into the same `document` and the old ones stay. The
first test passes; every later one finds two Roll buttons:

```text
 FAIL  src/App.test.tsx > App > rolls the dice and shows what each category would score
TestingLibraryElementError: Found multiple elements with the role "button" and name "Roll"
 FAIL  src/App.test.tsx > App > keeps held dice and stops after three rolls
TestingLibraryElementError: Found multiple elements with the role "button" and name "Roll"
 FAIL  src/App.test.tsx > App > records a score and starts the next turn
TestingLibraryElementError: Found multiple elements with the role "button" and name "Roll"
 FAIL  src/App.test.tsx > App > plays 13 turns to the end and starts again
TestingLibraryElementError: Found multiple elements with the role "button" and name "Roll"
```

### `App` takes an `rng`

To make the dice predictable in tests, `App` gets an rng prop like the coin's, used in `handleRoll`. The
changed part of `src/App.tsx`:

`src/App.tsx`
```tsx
import { rollDice, type Rng } from './game/dice'
// …

interface AppProps {
  /** Where random numbers come from. Tests pass a seeded generator. */
  rng?: Rng
}

function App({ rng = Math.random }: AppProps) {
  // The third argument is an initializer: React calls createGame() once to build the first state.
  const [state, dispatch] = useReducer(gameReducer, undefined, createGame)

  // … (unchanged)

  function handleRoll() {
    // Event handlers may be impure: roll here, then describe what happened.
    dispatch({ type: 'roll', values: rollDice(rng) })
  }
```

`main.tsx` still renders `<App />`, so the real game uses `Math.random`.

### Reducer tests

`src/game/reducer.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './rules'
import { createGame, gameReducer, getPhase, type GameAction, type GameState } from './reducer'

// A reducer is a pure function, so testing it needs no React at all:
// build a state, apply actions, check the result.
function play(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state)
}

const rollSixes: GameAction = { type: 'roll', values: [6, 6, 6, 6, 6] }

describe('gameReducer', () => {
  it('starts a game ready for the first roll', () => {
    const state = createGame()
    expect(getPhase(state)).toBe('ready')
    expect(state.rollsLeft).toBe(3)
  })

  it('rolls, counts down and must score after three rolls', () => {
    let state = play(createGame(), rollSixes)
    expect(getPhase(state)).toBe('rolling')
    state = play(state, rollSixes, rollSixes)
    expect(state.rollsLeft).toBe(0)
    expect(getPhase(state)).toBe('mustScore')
    // A fourth roll is ignored: the very same object comes back.
    expect(play(state, rollSixes)).toBe(state)
  })

  it('keeps held dice when rolling', () => {
    const state = play(
      createGame(),
      { type: 'roll', values: [1, 2, 3, 4, 5] },
      { type: 'toggleHold', id: 0 },
      rollSixes,
    )
    expect(state.dice.map((die) => die.value)).toEqual([1, 6, 6, 6, 6])
  })

  it('ignores holding and scoring before the first roll', () => {
    const state = createGame()
    expect(play(state, { type: 'toggleHold', id: 0 })).toBe(state)
    expect(play(state, { type: 'score', category: 'chance' })).toBe(state)
  })

  it('scores the dice and starts a new turn', () => {
    const state = play(createGame(), rollSixes, { type: 'toggleHold', id: 1 }, { type: 'score', category: 'fiveOfAKind' })
    expect(state.sheet.scores.fiveOfAKind).toBe(50)
    expect(state.rollsLeft).toBe(3)
    expect(state.dice.some((die) => die.held)).toBe(false)
  })

  it('ignores scoring a category twice', () => {
    const state = play(createGame(), rollSixes, { type: 'score', category: 'sixes' }, rollSixes)
    expect(play(state, { type: 'score', category: 'sixes' })).toBe(state)
  })

  it('ends after 13 turns and can start over', () => {
    let state = createGame()
    for (const category of CATEGORIES) {
      state = play(state, rollSixes, { type: 'score', category })
    }
    expect(getPhase(state)).toBe('gameOver')
    expect(play(state, rollSixes)).toBe(state)
    expect(play(state, { type: 'newGame' })).toEqual(createGame())
  })
})
```

- `play` is Chapter 7's fold as a test helper; each test reads like a short game log.
- "Ignored" checks use `toBe(state)`: the same object, so React would skip the render.
- The last test plays a whole game in milliseconds; through the UI it takes half a second.

### A snapshot of one die

`src/components/Die.test.tsx`
```tsx
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Die } from './Die'

// A snapshot records the rendered HTML and fails if it ever changes.
// Handy for small, stable output; a poor fit for anything that changes often.
it('renders a three as three pips on the diagonal', () => {
  const { container } = render(<Die value={3} held={false} disabled={false} onToggle={() => {}} />)
  expect(container.innerHTML).toMatchInlineSnapshot(`"<button type="button" class="die" aria-label="Die showing 3" aria-pressed="false"><span class="pip" style="grid-row: 1; grid-column: 1;"></span><span class="pip" style="grid-row: 2; grid-column: 2;"></span><span class="pip" style="grid-row: 3; grid-column: 3;"></span></button>"`)
})
```

Type `toMatchInlineSnapshot()` with empty parentheses and let Vitest fill in the string on the first run.
Check the recorded HTML: three pips, on the diagonal.

### App tests

`src/App.test.tsx`
```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { CATEGORIES, CATEGORY_LABELS } from './game/rules'
import type { Rng } from './game/dice'
import type { DieValue } from './game/types'

/** An rng that makes the dice show `faces` in order, over and over. */
function fakeDice(...faces: DieValue[]): Rng {
  let i = 0
  return () => (faces[i++ % faces.length] - 1) / 6
}

/** The values the five dice currently show, read the way a screen reader would. */
function diceValues() {
  return screen.getAllByRole('button', { name: /^Die showing/ }).map((die) => die.getAttribute('aria-label'))
}

function scoreButton(label: string) {
  const row = screen.getByRole('row', { name: new RegExp(`^${label}`) })
  return within(row).getByRole('button')
}

describe('App', () => {
  it('starts a turn with the Roll button and no scores to pick', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Roll' })).toBeEnabled()
    expect(screen.getByText(/Rolls left: 3/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Die showing/ })[0]).toBeDisabled()
    expect(screen.getByRole('row', { name: /^Chance/ })).not.toContainElement(screen.queryByRole('button', { name: /^\d+$/ }))
  })

  it('rolls the dice and shows what each category would score', async () => {
    const user = userEvent.setup()
    render(<App rng={fakeDice(6)} />)

    await user.click(screen.getByRole('button', { name: 'Roll' }))

    expect(diceValues()).toEqual(Array(5).fill('Die showing 6'))
    expect(screen.getByText(/Rolls left: 2/)).toBeInTheDocument()
    expect(scoreButton('Five of a Kind')).toHaveTextContent('50')
    expect(scoreButton('Sixes')).toHaveTextContent('30')
    expect(scoreButton('Full House')).toHaveTextContent('0')
  })

  it('keeps held dice and stops after three rolls', async () => {
    const user = userEvent.setup()
    render(<App rng={fakeDice(1, 2, 3, 4, 5, 6)} />)
    const roll = screen.getByRole('button', { name: 'Roll' })

    await user.click(roll) // 1 2 3 4 5
    const first = screen.getByRole('button', { name: 'Die showing 1' })
    await user.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')

    await user.click(roll) // the held die keeps its 1
    await user.click(roll)
    expect(diceValues()[0]).toBe('Die showing 1')
    expect(roll).toBeDisabled()
    expect(screen.getByText(/No rolls left/)).toBeInTheDocument()
  })

  it('records a score and starts the next turn', async () => {
    const user = userEvent.setup()
    render(<App rng={fakeDice(6)} />)

    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(scoreButton('Five of a Kind'))

    expect(screen.getByRole('row', { name: 'Five of a Kind 50' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: 'Total 50' })).toBeInTheDocument()
    expect(screen.getByText(/Rolls left: 3/)).toBeInTheDocument()
  })

  it('plays 13 turns to the end and starts again', async () => {
    const user = userEvent.setup()
    render(<App rng={fakeDice(6)} />)

    for (const category of CATEGORIES) {
      await user.click(screen.getByRole('button', { name: 'Roll' }))
      await user.click(scoreButton(CATEGORY_LABELS[category]))
    }

    // Sixes 30 + Three/Four of a Kind 30 + 30 + Five of a Kind 50 + Chance 30 = 170,
    // plus 100: Chance came after Five of a Kind, so its five sixes earn the bonus.
    expect(screen.getByRole('heading', { name: 'Game over' })).toBeInTheDocument()
    expect(screen.getByText(/Final score/)).toHaveTextContent('Final score: 270')
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Play again' }))
    expect(screen.getByRole('row', { name: 'Total 0' })).toBeInTheDocument()
  })
})
```

The helpers do most of the work:

- **`fakeDice(6)`** returns an rng that always gives `5/6`, so `rollDie` computes `Math.floor(5/6 * 6) + 1 =
  6`. `fakeDice(1, 2, 3, 4, 5, 6)` cycles through the faces.
- **`diceValues()`** reads each die's `aria-label`, the text a screen reader announces. The dice show only
  pips, so the label is the user-facing value.
- **`scoreButton('Sixes')`** finds the row whose accessible name starts with "Sixes", then the button
  *inside* it. `within(element)` gives the same queries, limited to that element. A row's accessible name is
  its cells' text joined with spaces, so a scored row is named `Five of a Kind 50`.
- `/^Die showing/`, `/Rolls left: 3/`: regular expressions match part of a name or text.

Each test checks behaviour a player would notice. None knows that `App` uses a reducer.

### Checkpoint

Run the tests (your times will differ):

```console
$ npm test

> five-dice@0.0.0 test
> vitest run

 RUN  v5.0.5 /home/you/five-dice

 ✓ src/game/dice.test.ts (6 tests) 5ms
 ✓ src/game/reducer.test.ts (7 tests) 4ms
 ✓ src/game/scoring.test.ts (30 tests) 8ms
 ✓ src/components/Die.test.tsx (1 test) 22ms

 ✓ src/App.test.tsx (5 tests) 840ms
   ✓ App (5)
     ✓ plays 13 turns to the end and starts again 508ms

 Test Files  5 passed (5)
      Tests  49 passed (49)
   Start at  15:45:45
   Duration  1.43s (environment 56%, tests 27%, setup 9%, transform 7%, import 2%, worker 1%)
```

The verbose reporter (`npx vitest run --reporter=verbose`) lists every test by name, one per line.

Then the coverage report. After the same test list, Vitest prints a table (trimmed here):

```console
$ npm run coverage

 % Coverage report from v8
----------------|---------|----------|---------|---------|-------------------
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------|---------|----------|---------|---------|-------------------
All files       |   98.48 |    97.93 |     100 |   98.23 |
 …
  Scorecard.tsx |     100 |       90 |     100 |     100 | 68
 src/game       |   98.03 |    98.68 |     100 |   97.61 |
  dice.ts       |     100 |      100 |     100 |     100 |
  reducer.ts    |    92.3 |    95.65 |     100 |   88.88 | 75-76
 …
----------------|---------|----------|---------|---------|-------------------
```

Every other file is at 100 %. Two places never ran:

- **`reducer.ts` 75–76** is the `never` default. It can't run; that is its point.
- **`Scorecard.tsx` 68** is a branch, `sums.upperBonus > 0 ? … : …`. No test earns the upper bonus: real
  untested behaviour, fixed in Exercise 1.

Open `coverage/index.html` and click through to `Scorecard.tsx` to see the branch marked. The build and the
linter still pass:

```console
$ npm run build
…
✓ 25 modules transformed.
…
✓ built in 127ms

$ npm run lint
…
Found 0 warnings and 0 errors.
```

Still 25 modules: tests are not in the app bundle. `tsc -b` does type-check them, so a type error in a test
breaks the build.

The game looks and plays as in Chapter 7. The complete project at this point is in `project/ch08/`.

## Summary

- **Test like a user** (role, label, text; `user-event`; visible results). Such tests survive refactors
  like Chapter 7's `useReducer`.
- Vitest runs component tests in **jsdom**. A setup file loads the **jest-dom** matchers
  (`@testing-library/jest-dom/vitest`) and calls **`cleanup()`** after each test.
- `render()` mounts; `screen` queries. **`getBy`** must find one, **`queryBy`** may find none, **`findBy`**
  waits. Prefer `ByRole` with `{ name }`; `ByTestId` last.
- A failed query prints roles and DOM; `screen.debug()` prints the DOM.
- `const user = userEvent.setup()` per test; **`await` every `user.*` call**.
- Async updates: **`await findBy…`** or **`await waitFor(…)`** (50 ms interval, 1000 ms timeout). Inject fake
  servers; time them with hand-made promises. `vi.fn()` records calls.
- **Inject randomness** (an `rng` prop defaulting to `Math.random`); keep it out of reducers.
- For direct imports, **`vi.mock(path, factory)`** replaces a module (hoisted above the imports);
  **`vi.stubGlobal('fetch', …)`** replaces `fetch` until `vi.unstubAllGlobals()`. MSW mocks at the network
  level.
- Test reducers with plain calls: `toBe` for identity (ignored actions), `toEqual` for structure.
- **Snapshots** fail on any change: keep them small and few; review every `-u`.
- **Coverage** (`vitest run --coverage`, v8) maps untested lines and branches; it isn't a target.

## Exercises

1. **Cover the upper bonus.** In `src/components/Scorecard.test.tsx`, render `Scorecard` directly with an
   upper section totalling 63 and check that the "Upper bonus" row shows 35. Run `npm run coverage` again.

   <details><summary>Solution</summary>

   `src/components/Scorecard.test.tsx`
   ```tsx
   import { render, screen } from '@testing-library/react'
   import { expect, it } from 'vitest'
   import { Scorecard } from './Scorecard'

   it('shows the upper bonus once the upper section reaches 63', () => {
     const sheet = {
       scores: { ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 },
       fiveOfAKindBonuses: 0,
     }
     render(<Scorecard sheet={sheet} potential={null} onScore={() => {}} />)
     expect(screen.getByRole('row', { name: /^Upper bonus/ })).toHaveTextContent('35')
   })
   ```

   Three of each face is exactly 63. `Scorecard.tsx` now has 100 % branch coverage; only `reducer.ts` 75–76
   is left. Testing `Scorecard` alone is much shorter than playing a bonus-earning game through `App`.

   </details>

2. **One more rule.** Add a reducer test: after three rolls, `toggleHold` is ignored.

   <details><summary>Solution</summary>

   Add it inside the `describe` in `src/game/reducer.test.ts`:

   ```ts
   it('ignores holding a die when no rolls are left', () => {
     const state = play(createGame(), rollSixes, rollSixes, rollSixes)
     expect(play(state, { type: 'toggleHold', id: 0 })).toBe(state)
   })
   ```

   `npm test` now reports 8 tests in `reducer.test.ts`.

   </details>

3. **Test the counter.** Write `examples/ch07/counter.test.tsx` for Chapter 7's counter: Undo starts
   disabled, +5 and +1 make 6, and two Undos go back to 0 and disable it again.

   <details><summary>Solution</summary>

   ```tsx
   import { render, screen } from '@testing-library/react'
   import userEvent from '@testing-library/user-event'
   import { expect, it } from 'vitest'
   import Counter from './counter.demo'

   it('undoes additions one at a time', async () => {
     const user = userEvent.setup()
     render(<Counter />)
     const undo = screen.getByRole('button', { name: 'Undo' })
     expect(undo).toBeDisabled()

     await user.click(screen.getByRole('button', { name: '+5' }))
     await user.click(screen.getByRole('button', { name: '+1' }))
     expect(screen.getByRole('heading')).toHaveTextContent('Count: 6')

     await user.click(undo)
     expect(screen.getByRole('heading')).toHaveTextContent('Count: 5')
     await user.click(undo)
     expect(screen.getByRole('heading')).toHaveTextContent('Count: 0')
     expect(undo).toBeDisabled()
   })
   ```

   ```console
   $ npx vitest run ch07
   ```

   `undo` stays valid across renders: React updates the existing DOM element instead of creating a new one.

   </details>

4. **Why does this pass?** In the first `NameCheck` test, replace
   `expect(await screen.findByText('Cy is available.'))` with `expect(screen.getByText('Cy is available.'))`.
   It still passes. Why, and should you keep it?

   <details><summary>Solution</summary>

   `vi.fn(async () => true)` returns a promise that resolves at once. Testing Library runs each `user.*` call
   inside React's `act()` helper, which lets such quick promises settle and applies their state updates before
   `await user.click(…)` returns. So "Cy is available." is already on screen when `getByText` runs.

   Don't keep it: it depends on how long `user.click` happens to wait and how fast the fake resolves. With the
   500 ms default server the same `getByText` fails, as shown in [Async code](#async-code-findby-and-waitfor).
   When an update follows a promise, use `findBy…` or `waitFor`; they cost nothing if the element is already
   there.

   </details>

Sources for this chapter: [REFERENCES.md](REFERENCES.md#chapter-8--testing)
