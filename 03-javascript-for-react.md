# Chapter 3 — The JavaScript React Depends On

You know JavaScript from DOM scripting and TypeScript from the
[TypeScript crash course](https://github.com/sipak-gh/learn-typescript-crashcourse). React leans hard on a
few language ideas that DOM code rarely forces on you: immutable updates and reference equality, closures
that capture one call's values, array methods instead of loops, destructuring and spread, and the event
loop's rules about what runs when. This chapter covers those, compared with the Chapter 2 roller where it
helps. Everyday syntax (arrow functions, `?.` and `??`, promises, classes) is in the crash course; the last
section lists where. In the project you write the dice logic as pure functions and test it with Vitest.
[Chapter 4](04-components-and-jsx.md) starts React proper.

Every example is a plain TypeScript file. Run it with Node from the `examples` folder:

```console
$ cd examples
$ node ch03/equality.ts
```

Node strips the types and runs the file ([Chapter 1](01-getting-started.md#nodejs-and-npm-the-tooling-runtime));
the JavaScript behaves as in the browser.

## Modules: named and default exports

Every `.ts` file in a Vite project is an ES module, with `import` and `export`. Two export styles meet you in
every React codebase:

| Syntax | Meaning |
|---|---|
| `export function rollDie…`, `import { rollDie } from './dice'` | A **named** export: the importer uses the same name |
| `export default App`, `import App from './App'` | The module's one **default** export, imported under any name |
| `import type { Die } from './types'` | A type-only import, removed from the JavaScript |

The template's `App.tsx` uses a default export; the game's own modules use named exports, which keep one
name everywhere and are easy to search for. The project's `verbatimModuleSyntax` setting makes `import type`
mandatory for types ([Chapter 1](01-getting-started.md#the-typescript-configs)). Node needs the `.ts`
extension in import paths; Vite doesn't, so the project leaves it out. The crash course's
[Modules and declarations](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/09-modules-and-declarations.md)
covers the rest.

## Destructuring and spread

React code destructures constantly: props in a component's parameter list, the `[value, setter]` pair from
`useState`. And every state update is a spread copy.

`examples/ch03/destructuring.ts`
```ts
interface Die {
  id: number
  value: number
  held: boolean
}
const die: Die = { id: 0, value: 3, held: false }

// Destructuring in a parameter list: React components receive their props like this.
// A default applies only when the value is undefined.
function label({ value, held = false }: { value: number; held?: boolean }) {
  return held ? `[${value}]` : `${value}`
}
console.log(label(die), label({ value: 6, held: true }), label({ value: 2 }))

// Pick some properties, collect the rest: how a component passes the other props on.
const { id, ...rest } = die
console.log(id, rest)

// Array destructuring picks by position. useState returns a [value, setter] pair you unpack this way.
const [first, second, ...others] = [6, 5, 4, 3, 2]
console.log(first, second, others)

// Spread copies with changes: later properties win, and the original is untouched.
const heldDie = { ...die, held: true }
const dice = [die, heldDie]
const more = [...dice, { ...die, id: 2 }]
console.log(heldDie, die.held, more.length)

// The copy is shallow: nested objects are shared, not copied.
const game = { round: 1, dice: [1, 2, 3] }
const copy = { ...game }
copy.dice.push(4)
console.log(game.dice, copy.dice === game.dice)
```

```console
$ node ch03/destructuring.ts
3 [6] 2
0 { value: 3, held: false }
6 5 [ 4, 3, 2 ]
{ id: 0, value: 3, held: true } false 3
[ 1, 2, 3, 4 ] true
```

`{ ...die, held: true }` copies every property, then overrides `held`; `die.held` is still `false`.

**Gotcha: spread is shallow.** It copies one level: `copy.dice` and `game.dice` are the same array, so a push
changes both. To change a nested value without touching the original, copy each level on the path:
`{ ...game, dice: [...game.dice, 4] }`.

## Array methods

JSX has no template loops: you render a list by `map`ping data to elements, and the scoring rules in later
chapters are mostly `filter`, `reduce` and friends. What matters for React is which methods **mutate**:

| Method | Returns | Mutates? |
|---|---|---|
| `map(f)` | a new array of `f(item)` | no |
| `filter(pred)` | a new array of the items where `pred` is true | no |
| `reduce(f, initial)` | one value, built up item by item: `f(acc, item)` | no |
| `some(pred)` / `every(pred)` | `true` if any / all items match | no |
| `find(pred)` / `findIndex(pred)` | the first match / its index (`undefined` / `-1` if none) | no |
| `includes(x)` | `true` if `x` is in the array | no |
| `slice(start, end)`, `concat`, `toSorted`, `toReversed`, `toSpliced`, `with(i, x)` | a new array | no |
| `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill` | various | **yes** |

On React state, use only the non-mutating ones. `toSorted`, `toReversed`, `toSpliced` and `with` were added
in ES2023 as copying versions of the classic mutators:

`examples/ch03/arrays.ts`
```ts
const values = [3, 6, 3, 1, 3]

// reduce folds a list into one value, here a total. It doesn't change `values`.
console.log('reduce  ', values.reduce((sum, v) => sum + v, 0))

// Copying versions of the classic mutators: a sorted copy, a copy with one element replaced.
const sorted = values.toSorted((a, b) => a - b)
console.log('toSorted', sorted, values)
const changed = values.with(0, 6)
console.log('with    ', changed, values)

// sort() MUTATES the array, and returns the same array.
const mutated = values.sort((a, b) => a - b)
console.log('sort    ', mutated, values, mutated === values)

// Without a compare function, sort() compares the values as strings.
console.log('gotcha  ', [10, 9, 1].toSorted())
```

```console
$ node ch03/arrays.ts
reduce   16
toSorted [ 1, 3, 3, 3, 6 ] [ 3, 6, 3, 1, 3 ]
with     [ 6, 6, 3, 1, 3 ] [ 3, 6, 3, 1, 3 ]
sort     [ 1, 3, 3, 3, 6 ] [ 1, 3, 3, 3, 6 ] true
gotcha   [ 1, 10, 9 ]
```

**Gotcha:** for numbers, always pass `sort` or `toSorted` a compare function. `(a, b) => a - b` sorts
ascending: a negative result puts `a` first.

## Immutability and reference equality

The Chapter 2 roller changed its arrays in place (`values[i] = …`, `held.fill(false)`) and then patched
the DOM. React works the other way round: you hand it new state, and it must tell whether anything changed.
It does that by comparing references.

`===` compares **primitives** (numbers, strings, booleans, `null`, `undefined`) by value and **objects and
arrays by reference**: equal only if they're the same object.

`examples/ch03/equality.ts`
```ts
// Primitives compare by value. Objects and arrays compare by reference (identity).
const word = 'ab'
console.log(word === 'a' + 'b')
const x = { value: 3 }
const y = { value: 3 }
console.log(x === y, x.value === y.value)

const a = { value: 3 }
const b = a // copies the reference, not the object
b.value = 6
console.log(a.value, a === b)

// Object.is is === except for two edge cases. React compares state with it.
const notANumber = Number('six') // NaN
const negativeZero = Math.round(-0.4) // -0
console.log(notANumber === notANumber, Object.is(notANumber, notANumber))
console.log(negativeZero === 0, Object.is(negativeZero, 0))

// Mutation: the same object, changed. A reference check can't see the change.
const dice = [{ id: 0, value: 1 }, { id: 1, value: 2 }]
const before = dice
dice[0].value = 5
console.log('mutated:   changed?', !Object.is(before, dice))

// Immutable update: a new array and a new object for what changed; the rest is shared.
const next = dice.map((d) => (d.id === 1 ? { ...d, value: 6 } : d))
console.log('immutable: changed?', !Object.is(dice, next), '| die 0 shared?', next[0] === dice[0])

// structuredClone makes a deep copy: nothing is shared.
const clone = structuredClone(dice)
console.log('clone equal?', clone[0].value === dice[0].value, '| same object?', clone[0] === dice[0])
```

```console
$ node ch03/equality.ts
true
false true
6 true
false true
true false
mutated:   changed? false
immutable: changed? true | die 0 shared? true
clone equal? true | same object? false
```

`NaN` isn't equal to itself, and `0 === -0`; `Object.is` fixes both.

### Why React cares

React decides whether state changed by comparing the old and new value with `Object.is`. For objects that's
an identity check, equally cheap however big the state. It works only if you **never mutate** state:

- **Mutation** (`dice[0].value = 5`) keeps the reference. To the check nothing changed, so React may skip the
  update and the screen goes stale.
- An **immutable update** (`map` + spread) creates new objects along the path to the change and reuses the
  rest. The check sees the change.

The reused parts (`next[0] === dice[0]`) keep their identity. By default that doesn't save any work: when a
component re-renders, React re-renders its children too. But a component wrapped in `memo` compares its
props by reference and skips rendering when they're the same objects
([Chapter 16](16-rendering-and-performance.md)). [Chapter 5](05-state-and-events.md) shows what goes wrong
when you mutate React state.

`structuredClone` makes a full deep copy: handy in tests (a pristine copy to compare against), but wrong for
state updates, because it gives every part a new identity.

### `readonly` helps, but only one level deep

TypeScript can stop some mutations at compile time. A `readonly Die[]` has no `push`, `sort` or index
assignment:

```ts
export function holdFirst(dice: readonly Die[]) {
  dice[0].held = true
  dice.push({ id: 5, value: 1, held: false })
  return dice
}
```

```text
src/bad.ts(5,8): error TS2339: Property 'push' does not exist on type 'readonly Die[]'.
```

`dice[0].held = true` compiles: `readonly` protects the array, not the objects in it. Like spread, it's
shallow. The project uses `readonly` array parameters to document "I don't change this", and tests to check
it. The crash course's [Objects and interfaces](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/04-objects-and-interfaces.md)
covers `readonly` properties.

## Closures

The Chapter 2 roller is full of closures. `button.addEventListener('click', () => toggleHold(i))` creates
a function that remembers the `i` of its loop iteration. And `toggleHold` reads the module-level `held`
array whenever it runs, so it always sees the **current** value.

React components are closures too, with one difference that matters: a component is a function React calls
once per render, so its state values are constants **of that call**. Every handler created during a render
sees that render's values, even if it runs later.

`examples/ch03/closures.ts`
```ts
// A closure: a function plus the variables it captured from where it was created.
function makeCounter() {
  let count = 0 // private: only the returned functions can reach it
  return {
    increment: () => ++count,
    current: () => count,
  }
}
const c1 = makeCounter()
const c2 = makeCounter()
c1.increment()
c1.increment()
c2.increment()
console.log(c1.current(), c2.current()) // each call to makeCounter has its own `count`

// let in a loop: each iteration gets a fresh binding, so each callback sees its own i.
const callbacks: (() => number)[] = []
for (let i = 0; i < 3; i++) callbacks.push(() => i)
console.log(callbacks.map((f) => f()))

// A closure captures a variable, not a copy of its value...
let score = 10
const readScore = () => score
score = 20
console.log(readScore())

// ...but a const captured in a call is fixed for that call. React's state works like this.
function snapshot(value: number) {
  return () => `value at creation: ${value}`
}
let current = 1
const show = snapshot(current)
current = 2
console.log(show(), '| now:', current)
```

```console
$ node ch03/closures.ts
2 1
[ 0, 1, 2 ]
20
value at creation: 1 | now: 2
```

- Each `makeCounter` call creates a new `count`: private state without a class.
- `readScore` captures the **variable** `score` and sees the later `20`, like the roller's handlers reading
  `held`.
- `snapshot(current)` got the *value* 1 as its parameter, a new variable for that call, and the closure keeps
  it. A React render works like `snapshot`: that's why state looks like a snapshot
  ([Chapter 5](05-state-and-events.md)).

The flip side is the **stale closure**: a timer or listener created during one render keeps reading that
render's values long after newer renders exist. [Chapter 11](11-effects.md) runs into it and fixes it.

## The event loop and async code

JavaScript runs your code on **one thread**, the page's main thread, which also does layout and painting.
The event loop takes one **task** (a script, a timer callback, a click) and runs it to completion, then runs
**every microtask** queued meanwhile (promise callbacks, the rest of an `async` function after an `await`),
then lets the browser repaint, then takes the next task.

`examples/ch03/event-loop.ts`
```ts
// What runs when? First all synchronous code, then every microtask, then the next task.
console.log('1 script start')

setTimeout(() => console.log('7 timeout callback (a task)'), 0)

Promise.resolve().then(() => console.log('4 promise callback (a microtask)'))
queueMicrotask(() => console.log('5 queueMicrotask callback (a microtask)'))

async function work() {
  console.log('2 async function: runs synchronously up to its first await')
  await null
  console.log('6 async function: the rest runs as a microtask')
}
work()

console.log('3 script end')
```

```console
$ node ch03/event-loop.ts
1 script start
2 async function: runs synchronously up to its first await
3 script end
4 promise callback (a microtask)
5 queueMicrotask callback (a microtask)
6 async function: the rest runs as a microtask
7 timeout callback (a task)
```

Two consequences for React code:

- **Nothing interrupts synchronous code.** A long loop in a handler or a render freezes the page: clicks
  queue up and nothing repaints until it ends ([Chapter 16](16-rendering-and-performance.md)).
- **Async work interleaves between `await`s.** `await` pauses the function, not the thread. While it waits,
  other tasks run: clicks, timers, other responses. When it resumes, the world may have moved on:

`examples/ch03/interleave.ts`
```ts
// Between awaits, other code runs. Two overlapping loads can finish in either order.
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let shown = ''

async function showPlayer(name: string, ms: number) {
  await delay(ms) // pretend to fetch the player; other tasks run meanwhile
  shown = name // whoever finishes LAST wins, not whoever was asked for last
  console.log('showing', shown)
}

showPlayer('Ada', 100) // the user picks Ada…
showPlayer('Grace', 10) // …then Grace, whose answer comes back faster
```

```console
$ node ch03/interleave.ts
showing Grace
showing Ada
```

The user's last choice was Grace, but Ada's slow answer arrived last and overwrote it. That's a **race
condition**, and every data-loading component must guard against it: [Chapter 11](11-effects.md) ignores
stale responses, and [Chapter 17](17-async-react.md) cancels them.

## The rest: in the crash course

Everything else React code uses is everyday JavaScript and TypeScript:

- **Arrow functions**, default and rest parameters, typed callbacks:
  [Functions](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/03-functions.md).
- **`?.` and `??`**, and narrowing `null` away:
  [Unions and narrowing](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/05-unions-and-narrowing.md).
  Prefer `??` to `||` for defaults: in a dice game 0 is a real score.
- **Promises and `async`/`await`**, typing errors in `catch`:
  [Async, iterators and resources](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/10-async-iterators-and-resources.md).
  `setTimeout` returns an id, and `clearTimeout(id)` cancels the timer; React effects clean up this way
  ([Chapter 11](11-effects.md)).
- **Classes and `this`**: [Classes](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/06-classes.md).
  Function components have no `this`: state lives in closures and handlers are plain functions, so the
  classic bug of a method losing its `this` when passed as a callback can't happen. The one class in this
  course is the error boundary in [Chapter 17](17-async-react.md), which React still only supports as a
  class.

## Building Five Dice: the dice module

The game's rules don't belong in UI components. Write them as **pure functions** in plain TypeScript (same
input, same output, no side effects): easy to reason about and test, and components call them later. This
chapter starts with the dice; the UI doesn't change.

### Install Vitest

**Vitest**, the Vite team's test runner, shares Vite's config and TypeScript handling, so tests need no
extra setup. Install it as a dev dependency:

```console
$ npm install -D vitest
added 20 packages, and audited 49 packages in 1s
…
found 0 vulnerabilities
```

`package.json` gets one more line in `devDependencies`:

```json
    "vitest": "^5.0.5"
```

### The types

Create the folder `src/game/` and the file `types.ts` in it:

`src/game/types.ts`
```ts
/** A face of a six-sided die. A union of literal types: 0 or 7 won't compile. */
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6

/** One die on the table. */
export interface Die {
  /** Stable identity for the whole game (position 0–4). */
  id: number
  value: DieValue
  /** A held die is kept: the next roll leaves it alone. */
  held: boolean
}
```

`/** … */` are **JSDoc** comments; editors show them when you hover over the name.

### The dice functions

`src/game/dice.ts`
```ts
import type { Die, DieValue } from './types'

/** A random number source: returns a float in [0, 1), just like Math.random. */
export type Rng = () => number

export const DICE_COUNT = 5

/** Roll one die. Pass your own `rng` to make the result predictable. */
export function rollDie(rng: Rng = Math.random): DieValue {
  // rng() is in [0, 1) → times 6 is in [0, 6) → floor gives 0..5 → plus 1 gives 1..6.
  return (Math.floor(rng() * 6) + 1) as DieValue
}

/** Roll `count` dice and return only the values. */
export function rollDice(rng: Rng = Math.random, count = DICE_COUNT): DieValue[] {
  return Array.from({ length: count }, () => rollDie(rng))
}

/** Make a fresh set of dice, none held. */
export function createDice(values: readonly DieValue[] = [1, 2, 3, 4, 5]): Die[] {
  return values.map((value, id) => ({ id, value, held: false }))
}

/**
 * Apply freshly rolled `values` to the dice: each die that is not held takes
 * the value at its position. Returns a new array and never mutates `dice`.
 */
export function applyRoll(dice: readonly Die[], values: readonly DieValue[]): Die[] {
  return dice.map((die, i) => (die.held ? die : { ...die, value: values[i] }))
}

/**
 * A seeded pseudo-random generator (the "mulberry32" algorithm).
 * The same seed always gives the same sequence, which makes tests repeatable.
 * `state` lives in a closure: each call to the returned function updates it.
 */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0 // force to an unsigned 32-bit integer
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 // 2^32 → result in [0, 1)
  }
}
```

The ideas from this chapter, in order:

- **Named exports**, and `import type` for the types.
- **An injectable dependency.** `Math.random()` answers differently each time, so a function using it can't
  be tested exactly. `rollDie` takes the random source as a parameter, `rng`, **defaulting** to
  `Math.random`. The game calls `rollDie()`; tests pass a fake.
- `as DieValue`: the arithmetic gives a `number`, and TypeScript can't prove it's 1–6. The comment explains
  why it is; a test checks it.
- **`map` + spread** in `createDice` and `applyRoll`: new arrays and objects, with held dice reused as-is.
  That's the immutable update React needs in [Chapter 5](05-state-and-events.md).
- **A closure** in `createSeededRng`: `state` is private to each generator and advances on every call.
- The bit operations are mulberry32, a small, well-known pseudo-random generator. You needn't follow them:
  `>>> 0` makes a number an unsigned 32-bit integer, and `Math.imul` multiplies with 32-bit wrap-around,
  which JavaScript's 64-bit floating-point numbers don't do on their own.

Purity is the habit to keep: [Chapter 4](04-components-and-jsx.md) asks the same of components.

### The tests

Vitest finds every file ending in `.test.ts` (or `.test.tsx`, `.spec.ts`, …). Put tests next to the code
they test. `describe` and `it` group and name tests like `node:test` in the crash course; `expect` is
Vitest's assertion API:

`src/game/dice.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { applyRoll, createDice, createSeededRng, rollDice, rollDie } from './dice'

describe('rollDie', () => {
  it('maps the range [0, 1) onto the faces 1 to 6', () => {
    expect(rollDie(() => 0)).toBe(1)
    expect(rollDie(() => 0.5)).toBe(4)
    expect(rollDie(() => 0.9999)).toBe(6)
  })
})

describe('createSeededRng', () => {
  it('repeats the same sequence for the same seed', () => {
    const first = rollDice(createSeededRng(42))
    const second = rollDice(createSeededRng(42))
    expect(first).toEqual(second)
  })

  it('only ever produces faces 1 to 6, and all of them', () => {
    const values = rollDice(createSeededRng(1), 600)
    expect(values.every((v) => v >= 1 && v <= 6)).toBe(true)
    expect(new Set(values).size).toBe(6)
  })
})

describe('applyRoll', () => {
  it('changes only the dice that are not held', () => {
    const dice = createDice([1, 1, 1, 1, 1]).map((die) =>
      die.id === 0 ? { ...die, held: true } : die,
    )
    const result = applyRoll(dice, [6, 6, 6, 6, 6])
    expect(result.map((die) => die.value)).toEqual([1, 6, 6, 6, 6])
  })

  it('does not mutate the original dice', () => {
    const dice = createDice()
    const copy = structuredClone(dice)
    const result = applyRoll(dice, [6, 6, 6, 6, 6])
    expect(dice).toEqual(copy)
    expect(result).not.toBe(dice)
  })
})
```

The matchers are reference equality again. `.toBe` compares with `Object.is`: right for primitives, or to
assert "the very same object". `.toEqual` compares **contents** deeply. `expect([1]).toBe([1])` fails;
`expect([1]).toEqual([1])` passes. The last test uses both: the original must match its deep copy
(`toEqual`), and the result must be a different array (`.not.toBe`).

`() => 0` and `() => 0.5` are tiny fake random sources. The seeded generator's sequence looks random but
repeats, so a 600-roll test is stable. A `Set` keeps unique values, so `size` 6 means every face appeared.

### Run the tests

The project has no `test` script yet ([Chapter 8](08-testing.md) adds it), so run Vitest with `npx`:

```console
$ npx vitest run

 RUN  v5.0.5 /home/you/five-dice

 ✓ src/game/dice.test.ts (5 tests) 4ms
   ✓ rollDie (1)
     ✓ maps the range [0, 1) onto the faces 1 to 6 1ms
   ✓ createSeededRng (2)
     ✓ repeats the same sequence for the same seed 1ms
     ✓ only ever produces faces 1 to 6, and all of them 0ms
   ✓ applyRoll (2)
     ✓ changes only the dice that are not held 0ms
     ✓ does not mutate the original dice 0ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  15:45:42
   Duration  106ms (transform 60%, import 22%, tests 11%, worker 7%)
```

`vitest run` runs once and exits, like a CI job. Plain `npx vitest` starts **watch mode**, rerunning
affected tests on every save until you press `q`.

To see a failure, change `toBe(4)` to `toBe(3)` and run again. The report names the test, shows expected
versus received, and points at the line:

```console
 FAIL  src/game/dice.test.ts > rollDie > maps the range [0, 1) onto the faces 1 to 6
AssertionError: expected 4 to be 3 // Object.is equality

- Expected
+ Received

- 3
+ 4

 ❯ src/game/dice.test.ts:7:32
```

The exit code is 1, so CI would fail. Change it back to `toBe(4)`.

Vitest needs no config here: it runs tests in Node, which suits pure functions.
[Chapter 8](08-testing.md) configures a browser-like environment for testing components.

### Checkpoint

```console
$ npx vitest run
…
 Test Files  1 passed (1)
      Tests  5 passed (5)

$ npm run build
…
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-C0AM3gPW.css    0.89 kB │ gzip:  0.45 kB
dist/assets/index-DCUOIxk5.js   220.17 kB │ gzip: 68.78 kB
✓ built in 116ms

$ npm run lint
…
Found 0 warnings and 0 errors.
```

The bundle is identical to [Chapter 2](02-from-vanilla-dom-to-react.md)'s: nothing imports `src/game/` yet, so
Vite leaves it out. `tsc -b` does type-check the new files, tests included. The page hasn't changed.

The complete project at this point is in `project/ch03/`.

## Summary

- Components destructure props and the `useState` pair; state updates are **spread** copies. Spread is
  shallow: copy every level on the path to a nested change.
- `map`, `filter`, `reduce` and the copying `toSorted`/`with` never mutate; `sort`, `push`, `splice` and
  friends do. Use only the first kind on state.
- `===` compares objects by **reference**; `Object.is` also handles `NaN` and `-0`. React detects state
  changes by reference, so update immutably: new objects along the changed path, everything else shared.
  Shared parts let `memo`-wrapped components skip work.
- A **closure** keeps the variables of the scope it was created in. Each render's handlers see that render's
  values: state is a snapshot, and old closures can go stale.
- One thread runs one task to completion, then all microtasks. Synchronous code is never interrupted, but
  async code interleaves between `await`s, so a late response can overwrite a newer one.
- Pure functions with injected dependencies (the `rng`) are easy to test. **Vitest** runs `*.test.ts`
  files; `toBe` checks identity, `toEqual` contents.

## Exercises

1. **Predict the order.** What does this print? Work it out, then run it.

   ```ts
   setTimeout(() => console.log('A'), 0)
   Promise.resolve().then(() => {
     console.log('B')
     setTimeout(() => console.log('C'), 0)
     Promise.resolve().then(() => console.log('D'))
   })
   console.log('E')
   ```

   <details><summary>Solution</summary>

   ```text
   E
   B
   D
   A
   C
   ```

   `E` is synchronous. Then the microtask `B` runs, queuing a task (`C`) and a microtask (`D`). The
   microtask queue empties completely, so `D` runs before any task. Then the tasks run in order: `A`, then
   `C`.

   </details>

2. **Count the faces.** Scoring needs to know how many dice show each face; [Chapter 6](06-thinking-in-react.md)
   writes the game's version. Write `countFaces(values: readonly number[]): number[]` in
   `examples/ch03/count-faces.ts`: six counts (index 0 for the 1s, index 5 for the 6s), using `reduce`,
   mutating nothing. Write a test file and run it with `npx vitest run ch03` in `examples/`.

   <details><summary>Solution</summary>

   `examples/ch03/count-faces.ts`
   ```ts
   /** How many dice show each face: index 0 counts the 1s, index 5 counts the 6s. */
   export function countFaces(values: readonly number[]): number[] {
     return values.reduce(
       (counts, value) => counts.with(value - 1, counts[value - 1] + 1),
       [0, 0, 0, 0, 0, 0],
     )
   }
   ```

   `with` returns a new array each time, so even the accumulator is never mutated. (Mutating a fresh
   accumulator nobody else sees would be fine too; this is the strict version.)

   `examples/ch03/count-faces.test.ts`
   ```ts
   import { describe, expect, it } from 'vitest'
   import { countFaces } from './count-faces.ts'

   describe('countFaces', () => {
     it('counts each face', () => {
       expect(countFaces([3, 6, 3, 1, 3])).toEqual([1, 0, 3, 0, 0, 1])
     })

     it('gives all zeros for no dice', () => {
       expect(countFaces([])).toEqual([0, 0, 0, 0, 0, 0])
     })

     it('does not change its input', () => {
       const values = [5, 5, 2]
       countFaces(values)
       expect(values).toEqual([5, 5, 2])
     })
   })
   ```

   ```console
   $ npx vitest run ch03

    RUN  v5.0.5 /home/you/learn-react/examples

    ✓ ch03/count-faces.test.ts (3 tests) 4ms
      ✓ countFaces (3)
        ✓ counts each face 2ms
        ✓ gives all zeros for no dice 0ms
        ✓ does not change its input 0ms

    Test Files  1 passed (1)
         Tests  3 passed (3)
      Start at  16:25:34
      Duration  541ms (environment 79%, setup 13%, transform 6%, tests 1%, worker 1%, import 1%)
   ```

   The examples run tests in a browser-like environment, which starts slower than the project's Node-only
   tests.

   </details>

3. **Break immutability.** In the project, rewrite `applyRoll` to change the dice in place with `forEach`
   and return `dice`. What does TypeScript say? Make it compile and run the tests.

   <details><summary>Solution</summary>

   ```ts
   export function applyRoll(dice: readonly Die[], values: readonly DieValue[]): Die[] {
     dice.forEach((die, i) => {
       if (!die.held) die.value = values[i]
     })
     return dice
   }
   ```

   ```text
   src/game/dice.ts(32,3): error TS4104: The type 'readonly Die[]' is 'readonly' and cannot be assigned to the mutable type 'Die[]'.
   ```

   `die.value = …` is accepted: `readonly` covers only the array. Return a copy, `return [...dice]`, and it
   compiles. Now one test fails:

   ```text
    FAIL  src/game/dice.test.ts > applyRoll > does not mutate the original dice
   AssertionError: expected [ …(5) ] to deeply equal [ …(5) ]
   ```

   The diff below shows every `value` in the original dice changed to `6`. `.not.toBe` alone would pass,
   since `[...dice]` is a new array; the deep comparison with the `structuredClone` copy catches the
   mutation. Restore the `map` version.

   </details>

4. **One generator, two rolls.** Create `src/game/try.ts`, run it with `node src/game/try.ts`, and explain
   the output. Delete the file afterwards.

   ```ts
   import { createSeededRng, rollDice } from './dice.ts'

   const rng = createSeededRng(42)
   console.log(rollDice(rng))
   console.log(rollDice(rng))
   console.log(rollDice(createSeededRng(42)))
   ```

   <details><summary>Solution</summary>

   ```console
   $ node src/game/try.ts
   [ 4, 3, 6, 5, 2 ]
   [ 4, 2, 4, 6, 3 ]
   [ 4, 3, 6, 5, 2 ]
   ```

   `rng` is a closure over its own `state`. The first `rollDice` advanced it five times, so the second call
   continues the sequence. A new generator with the same seed starts fresh and repeats the first five
   values.

   Node runs `dice.ts` although it imports `./types` without an extension: that's an `import type`, and
   type stripping removes it.

   </details>

Sources for this chapter: [REFERENCES.md](REFERENCES.md#chapter-3--the-javascript-react-depends-on)
