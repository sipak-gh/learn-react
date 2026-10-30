# Chapter 15 — Accessibility

An accessible app works for everyone: people using a screen reader or only the keyboard, zooming to 200%, seeing colours differently, or avoiding animation. Most of the work is HTML, not React: use the right elements, name every control, show focus, and announce changes. This chapter covers these, the ARIA attributes that fill HTML's gaps, and testing with the queries you've used since [Chapter 8](08-testing.md). In the project, five-dice announces rolls and scores, gets proper panel and scorecard structure, and a test plays a whole turn by keyboard. [Chapter 14](14-styling.md) styled the game; [Chapter 16](16-rendering-and-performance.md) looks at how fast it renders.

## Who you are building for

- **Screen reader users** (NVDA, JAWS, VoiceOver, Narrator, Orca) need real roles and names, structure to jump around, and changes announced.
- **Keyboard-only users** need every control reachable by Tab and focus that is always visible and never lost.
- **Low-vision and colour-blind users** need contrast, a layout that survives 200% zoom, and information not carried by colour alone.
- **Voice-control users** (Dragon, Voice Control) need names that match the visible text ("click Roll").
- **People with vestibular disorders** need less animation (`prefers-reduced-motion`, [Chapter 14](14-styling.md)).

The rules are in WCAG 2.2, the W3C's Web Content Accessibility Guidelines. Its numbered success criteria (1.4.3 is text contrast) have levels A, AA and AAA; AA is what laws and contracts usually require. This chapter quotes the criteria it uses.

### The accessibility tree

Assistive technology such as a screen reader reads the browser's **accessibility tree**, built alongside the DOM, not your HTML. Each node has:

- a **role**: what it is (`button`, `heading`, `list`, `textbox`…);
- a **name**: what it's called ("Roll", "Player 1");
- **states**: pressed, disabled, checked, current…;
- sometimes a **description**: extra help text.

From these, a screen reader says "Roll, button", or on a held die, "Die showing 6, toggle button, pressed".

To see it, use the **Accessibility** tab next to Styles in Chrome's Elements panel, or Firefox's **Accessibility** panel.

## Semantic HTML first

HTML elements come with roles and behaviour. A `<button>` is a button to the browser, the keyboard and the accessibility tree; a `<div>` with a click handler is a button only to a mouse.

`examples/ch15/div-button.demo.tsx`

```tsx
import { useState } from 'react'

export default function DivButtonDemo() {
  const [divCount, setDivCount] = useState(0)
  const [buttonCount, setButtonCount] = useState(0)

  return (
    <main>
      {/* Looks clickable, but only to a mouse. */}
      <div className="fake-button" onClick={() => setDivCount((n) => n + 1)}>
        Roll (div)
      </div>
      <p>Div clicks: {divCount}</p>

      {/* Focusable, works with Enter and Space, announced as "button". */}
      <button type="button" onClick={() => setButtonCount((n) => n + 1)}>
        Roll (button)
      </button>
      <p>Button clicks: {buttonCount}</p>
    </main>
  )
}
```

The test drives both by keyboard:

`examples/ch15/div-button.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import DivButtonDemo from './div-button.demo'

it('only the real button works from the keyboard', async () => {
  const user = userEvent.setup()
  render(<DivButtonDemo />)

  // The div is not a button to assistive technology, so it has no role.
  expect(screen.queryByRole('button', { name: 'Roll (div)' })).not.toBeInTheDocument()

  // Tab skips the div and lands on the button; Enter and Space press it.
  await user.tab()
  expect(screen.getByRole('button', { name: 'Roll (button)' })).toHaveFocus()
  await user.keyboard('{Enter}')
  await user.keyboard(' ')
  expect(screen.getByText('Button clicks: 2')).toBeInTheDocument()

  // A mouse click still works on the div.
  await user.click(screen.getByText('Roll (div)'))
  expect(screen.getByText('Div clicks: 1')).toBeInTheDocument()
})
```

```console
$ npx vitest run ch15/div-button
 ✓ ch15/div-button.test.tsx (1 test) 131ms
      Tests  1 passed (1)
```

Asked for the div as a button, Testing Library's error lists what *is* in the accessibility tree. The div isn't there:

```text
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Roll (div)"

Here are the accessible roles:

  main:
  …
  paragraph:
  …
  button:

  Name "Roll (button)":
  <button
    type="button"
  />
  …
```

To make the div act like the button, you'd need `role="button"` (announced as a button), `tabIndex={0}` (reachable by Tab), `onKeyDown` clicking on Enter and `onKeyUp` clicking on Space, `preventDefault()` on Space (no scrolling), a way to disable it (`aria-disabled` plus ignoring clicks; `disabled` does nothing on a div), and focus styles.

`<button>` has it all built in, as do links (`<a href>`), form fields, `<select>`, `<details>` and `<dialog>`. Use the element that means what you want and style it freely: Chapter 14 restyled five-dice's buttons completely, and they're still buttons. In React this is the commonest accessibility bug of all, because `onClick` works on any element and a `<div>` is easier to style.

### Elements and their roles

Every element has an **implicit role** that the browser knows without you writing it: `<button>` is `button`, `<a href>` is `link` (without `href` it isn't), `<h2>` is `heading` level 2, `<input type="number">` is `spinbutton`, `<select>` is `combobox`, and `<div>` and `<span>` are `generic`, which `getByRole` never finds. The ones that surprise:

| Element | Role | Notes |
|---|---|---|
| `<main>`, `<nav>` | `main`, `navigation` | Landmarks |
| `<header>`, `<footer>` | `banner`, `contentinfo` | Landmarks, unless inside `<main>`, `<section>`, `<article>`… |
| `<section>` | `region` | A landmark **only if it has a name** |
| `<img alt="">` | `presentation` | Ignored: a decorative image |
| `<th scope="col">`, `<th scope="row">` | `columnheader`, `rowheader` | A cell is then read with its headers: "Player 2, Sixes, 18" |

**Landmarks** are a page's big areas; screen readers can list them or jump between them, like scanning a layout by eye. `<main>` means "the content starts here". Data tables need `<th>` headers with `scope` and, ideally, a `<caption>` that names the table; five-dice's scorecard gets both below.

## Accessible names

Every control, and every meaningful image, needs a name. It's what a screen reader says, what a voice-control user says to click it, and what `getByRole(…, { name })` matches. It can come from several places:

`examples/ch15/names.test.tsx`

```tsx
import { logRoles, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'

// Where each element's accessible name comes from.
function Names() {
  return (
    <main>
      <button type="button">Roll</button>
      <button type="button" aria-label="Die showing 3">
        ⚂
      </button>
      <label>
        Player 1 <input defaultValue="Ada" />
      </label>
      <label htmlFor="rounds">Rounds</label>
      <input id="rounds" type="number" />
      <h2 id="standings">Standings</h2>
      <ol aria-labelledby="standings">
        <li>Ada</li>
      </ol>
      <img src="die.png" alt="A die showing six" />
      <img src="divider.png" alt="" />
      <button type="button">
        <svg aria-hidden="true" width="16" height="16" />
      </button>
    </main>
  )
}

it('names come from content, labels and ARIA', () => {
  const { container } = render(<Names />)
  logRoles(container)

  expect(screen.getByRole('button', { name: 'Die showing 3' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Player 1' })).toHaveValue('Ada')
  expect(screen.getByRole('spinbutton', { name: 'Rounds' })).toBeInTheDocument()
  expect(screen.getByRole('list')).toHaveAccessibleName('Standings')
  expect(screen.getByRole('img')).toHaveAccessibleName('A die showing six')
  // An icon-only button with no label: a button nobody can identify.
  expect(screen.getAllByRole('button')[2]).toHaveAccessibleName('')
})
```

`logRoles` prints each element's role and name, a text view of the accessibility tree. Use it when `getByRole` doesn't find what you expect.

```console
$ npx vitest run ch15/names
stdout | ch15/names.test.tsx > names come from content, labels and ARIA
…
button:

Name "Roll":
<button
  type="button"
/>

Name "Die showing 3":
<button
  aria-label="Die showing 3"
  type="button"
/>

Name "":
<button
  type="button"
/>
…
presentation:

Name "":
<img
  alt=""
  src="divider.png"
/>
…
 ✓ ch15/names.test.tsx (1 test) 167ms
```

The browser tries these sources in order; the first that gives a name wins:

| Source | Example | Use it for |
|---|---|---|
| `aria-labelledby="id …"` | The list above, named by its heading | Naming an element after text already on screen |
| `aria-label="…"` | The die: "Die showing 3" | Controls with no useful text: icons, pips |
| The element's own label | `<label>` for inputs, `alt` for images, `<caption>` for tables | Form fields, images, tables |
| Content | `<button>Roll</button>` | Buttons, links, headings, cells |

From the output:

- `aria-label` replaces the content, so the `⚂` is ignored.
- A `<label>` wraps the input or uses `htmlFor` (JSX for `for`); clicking it focuses the input.
- `alt=""` means "decorative": the image becomes `presentation` and is skipped. Without `alt`, some screen readers read the file name, "divider dot png".
- The `<svg>` with `aria-hidden="true"` isn't in the tree.
- The last button has no name; a screen reader says only "button". Give icon-only buttons an `aria-label`.
- A `placeholder` isn't a label: it vanishes as you type and is usually pale grey.

WCAG 2.5.3 ("Label in Name") asks that the name *contain* the visible label, so a voice-control user saying "click Roll" clicks Roll.

## ARIA

**ARIA** (Accessible Rich Internet Applications) is the `role` and `aria-*` attributes. They change *only* the accessibility tree: `role="button"` doesn't make a div keyboard-operable, and `aria-disabled` disables nothing. ARIA is a promise to the screen reader that your JavaScript must keep.

The first rule of ARIA (W3C, *Using ARIA*): if a native HTML element or attribute has the meaning and behaviour you need, use it instead. The ARIA Authoring Practices Guide: "No ARIA is better than Bad ARIA." The screen reader believes a wrong role.

Use ARIA for what HTML can't say. Five-dice needs:

| Attribute | Says | In five-dice |
|---|---|---|
| `aria-label` | The name, as a string | "Die showing 6"; "Score 30 in Sixes" |
| `aria-labelledby` | The name is the text of these elements (ids) | Each panel, named by its heading |
| `aria-describedby` | The description is the text of these elements (ids) | [Exercise 2](#exercises) |
| `aria-pressed` | A toggle button, on or off | Held dice |
| `aria-current` | The current item in a set | Whose turn it is |
| `aria-keyshortcuts` | The keys that activate it | Space on Roll; 1–5 on the dice |
| `aria-hidden="true"` | Leave this out of the tree | Decorative icons |
| `role="status"` | Announce changes to this text | Roll and score announcements |

Unlike most JSX attributes (`className`, `htmlFor`, `tabIndex`), `aria-*` keep their hyphens. React writes booleans as strings: `aria-pressed={true}` becomes `"true"`, `false` becomes `"false"`. TypeScript knows the allowed values:

```tsx
<button type="button" aria-pressed="yes">
  3
</button>
```

```text
error TS2322: Type '{ type: "button"; "aria-pressed": "yes"; children: string; }' is not assignable to type …
  …
      Type '"yes"' is not assignable to type '"false" | "mixed" | "true" | boolean | undefined'.
```

Tabs, menus, tree views and comboboxes with suggestions have no HTML element. The ARIA Authoring Practices Guide (APG) gives each a pattern (roles, states, keys); follow it exactly or use a component library that does ([Chapter 20](20-where-next.md)).

## Live regions

After Roll, a sighted player sees the dice change; a screen reader user, with focus still on Roll, hears nothing. A **live region** fixes that: the screen reader reads out changes to its text without moving focus.

`examples/ch15/live-region.demo.tsx`

```tsx
import { useState } from 'react'

export default function LiveRegionDemo() {
  const [message, setMessage] = useState('')

  function roll() {
    const value = Math.floor(Math.random() * 6) + 1
    setMessage(`You rolled ${value}.`)
  }

  return (
    <main>
      <button type="button" onClick={roll}>
        Roll
      </button>
      {/* Always rendered, empty at first: screen readers watch it for changes
          and read the new text without moving focus. */}
      <p role="status">{message}</p>
    </main>
  )
}
```

`examples/ch15/live-region.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import LiveRegionDemo from './live-region.demo'

it('puts the result in the status region', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5) // 0.5 * 6 = 3, + 1 = 4
  const user = userEvent.setup()
  render(<LiveRegionDemo />)

  const status = screen.getByRole('status')
  expect(status).toBeEmptyDOMElement()

  await user.click(screen.getByRole('button', { name: 'Roll' }))
  expect(status).toHaveTextContent('You rolled 4.')
  // Focus stays on the button: the user can roll again straight away.
  expect(screen.getByRole('button', { name: 'Roll' })).toHaveFocus()
})
```

The rules:

- **The region must exist before its text changes.** Screen readers watch regions already on the page; `{message && <p role="status">{message}</p>}` adds region and text at once, and many stay silent. Render it always, empty at first.
- `role="status"` is **polite**: the reader finishes its sentence first. It equals `aria-live="polite"` plus `aria-atomic="true"` (read the whole region).
- `role="alert"` (or `aria-live="assertive"`) interrupts: only for errors and warnings that can't wait.
- Keep announcements short.

### The same message twice

Screen readers announce *changes* to the region's DOM. In vanilla JS, `el.textContent = text` replaces the text node even when the string is the same, and whether that's read out varies between screen readers. In React it's certain to be silent: the same string leaves React nothing to change, so it doesn't touch the DOM. Roll a 4 twice and the second roll is silent. The second test in `live-region.test.tsx` proves it by recording DOM changes with a `MutationObserver`:

```tsx
it('changes nothing when the same number comes up twice', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  const user = userEvent.setup()
  render(<LiveRegionDemo />)
  const status = screen.getByRole('status')

  // Screen readers react to changes in the region's DOM. Record them.
  const changes: MutationRecord[] = []
  new MutationObserver((records) => changes.push(...records)).observe(status, {
    childList: true,
    characterData: true,
    subtree: true,
  })

  await user.click(screen.getByRole('button', { name: 'Roll' }))
  const afterFirstRoll = changes.length
  expect(afterFirstRoll).toBeGreaterThan(0)

  await user.click(screen.getByRole('button', { name: 'Roll' }))
  // The same string: React had nothing to change in the DOM.
  expect(changes).toHaveLength(afterFirstRoll)
})
```

```console
$ npx vitest run ch15/live-region
 ✓ ch15/live-region.test.tsx (2 tests) 131ms
      Tests  2 passed (2)
```

The vanilla trick of clearing the text and then setting it again doesn't help either: `setMessage('')` followed by `setMessage(text)` in one handler is batched into one render ([Chapter 5](05-state-and-events.md)), which again ends at the same string. Make the text itself differ: [Exercise 3](#exercises) does. Five-dice's announcements always differ from the previous one, because they include the rolls left or the category scored.

HTML's `<output>` (for a calculation's result) has the `status` role built in. Either works; this chapter uses `role="status"` on a `<p>`, which states its purpose anywhere.

## Focus and the keyboard

A reminder of the basics: Tab order is DOM order, so CSS reordering (grid areas, `order`, `row-reverse`) can make it disagree with what users see. `tabIndex={0}` adds an element to the Tab order (only custom widgets need it), `tabIndex={-1}` makes it focusable from code but not by Tab, and positive values jump the queue and confuse everyone. Controls handle their own keys: Enter and Space click buttons, arrows move within `<select>` and radio groups, Escape closes dialogs ([Chapter 18](18-portals-and-dialogs.md)).

Five-dice's page-wide shortcuts (Space rolls, 1–5 hold; [Chapter 11](11-effects.md), a Hook since [Chapter 13](13-custom-hooks.md)) stay out of the way: `useKeyboardShortcuts` ignores keys in form fields or with Ctrl, Alt or Meta, and leaves Space on a focused button to click it. WCAG 2.1.4 also requires that single-key shortcuts can be turned off or remapped, because voice-control users "type" words whose letters can trigger them. [Exercise 5](#exercises) adds the switch.

### Showing focus

Keyboard users must see where focus is (WCAG 2.4.7, "Focus Visible"). Browsers draw a focus ring, the `outline`, which you can style:

```css
:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}
```

- `:focus` matches any focus, even from a mouse click.
- `:focus-visible` matches when a ring helps: after keyboard navigation, and always in text fields. A clicked button gets focus but no ring.
- Never write `outline: none` without an equally visible replacement; it's one of the web's commonest accessibility bugs.
- `outline` takes no space, so it doesn't shift layout; `outline-offset` adds a gap that keeps the ring visible on a same-coloured button.

### Focus when the screen changes

A link in a multi-page site loads a new page: the browser resets focus to the top and a screen reader reads the new page's title. A React app swaps screens without loading a page, so neither happens. Worse, the button you pressed is usually part of the old screen. When the focused element leaves the page, focus falls back to `<body>`: a screen reader says nothing, and where the next Tab goes depends on the browser.

[Chapter 12](12-refs-and-the-dom.md) fixed one case: after scoring, focus moves to Roll. For a whole new screen, move focus to the new screen's **heading**:

- A screen reader reads it ("Game, heading level 1"), so the user knows where they are.
- The next Tab goes to the first control after it, as on a freshly loaded page.
- It needs `tabIndex={-1}`: focusable from code, without adding a Tab stop.

Do it in the event handler that changes the screen, never on mount: on first page load focus should stay where the browser puts it. This demo has two screens, each a component with a heading:

`examples/ch15/screen-focus.demo.tsx`

```tsx
import { useRef, useState, type Ref } from 'react'
import { flushSync } from 'react-dom'

interface ScreenProps {
  headingRef: Ref<HTMLHeadingElement>
  onDone: () => void
}

function Menu({ headingRef, onDone }: ScreenProps) {
  return (
    <main>
      {/* tabIndex={-1}: focusable from code, but not a Tab stop. */}
      <h1 ref={headingRef} tabIndex={-1}>
        Menu
      </h1>
      <button type="button" onClick={onDone}>
        Start game
      </button>
    </main>
  )
}

function Game({ headingRef, onDone }: ScreenProps) {
  return (
    <main>
      <h1 ref={headingRef} tabIndex={-1}>
        Game
      </h1>
      <button type="button" onClick={onDone}>
        Quit
      </button>
    </main>
  )
}

export default function ScreenFocusDemo({ moveFocus = true }: { moveFocus?: boolean }) {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu')
  // Whichever screen is showing attaches its heading here.
  const headingRef = useRef<HTMLHeadingElement>(null)

  function show(next: 'menu' | 'game') {
    if (!moveFocus) {
      setScreen(next)
      return
    }
    // Put the new screen on the page now, then focus its heading.
    flushSync(() => setScreen(next))
    headingRef.current?.focus()
  }

  return screen === 'menu' ? (
    <Menu headingRef={headingRef} onDone={() => show('game')} />
  ) : (
    <Game headingRef={headingRef} onDone={() => show('menu')} />
  )
}
```

- One ref serves both screens: only one heading is on the page at a time, and React points the ref at whichever is.
- `flushSync` ([Chapter 12](12-refs-and-the-dom.md)) renders the new screen before the next line runs, so `headingRef.current` is already the new heading.
- `moveFocus={false}` turns the fix off, for the test.

`examples/ch15/screen-focus.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import ScreenFocusDemo from './screen-focus.demo'

it('loses focus when the pressed button disappears', async () => {
  const user = userEvent.setup()
  render(<ScreenFocusDemo moveFocus={false} />)

  await user.click(screen.getByRole('button', { name: 'Start game' }))
  // The focused button left the page, so the browser fell back to <body>.
  expect(document.body).toHaveFocus()
})

it("moves focus to the new screen's heading", async () => {
  const user = userEvent.setup()
  render(<ScreenFocusDemo />)

  await user.click(screen.getByRole('button', { name: 'Start game' }))
  expect(screen.getByRole('heading', { name: 'Game' })).toHaveFocus()

  // The next Tab goes to the first control after the heading.
  await user.tab()
  expect(screen.getByRole('button', { name: 'Quit' })).toHaveFocus()

  await user.keyboard('{Enter}')
  expect(screen.getByRole('heading', { name: 'Menu' })).toHaveFocus()
})
```

```console
$ npx vitest run ch15/screen-focus
 ✓ ch15/screen-focus.test.tsx (2 tests) 140ms
      Tests  2 passed (2)
```

Why two components? A first version rendered the two screens as the same JSX shape inline, `<main><h1/><button/></main>`, with different text. The first test failed: focus stayed on the button. React compared the two trees, found a `<button>` at the same place, and kept the DOM node, changing only its text ([Chapter 10](10-composition-and-context.md#state-lives-in-the-tree-position-and-key)). Different component types, or different `key`s, give each screen its own DOM.

Other ways to handle a screen change: focus a wrapper around the new content, focus its first control, or leave focus and announce the change in a live region. [Gatsby's 2019 user testing](https://www.gatsbyjs.com/blog/2019-07-11-user-testing-accessible-client-routing/) of these with disabled users found focusing the heading the best experience for screen reader users, and a small focused element easier to spot than a full-width wrapper for sighted users of voice control and magnification. A live region alone does nothing for those sighted users. Routers ([Chapter 20](20-where-next.md)) differ in what they do for you; check before relying on it.

## Colour and contrast

Text must stand out from its background. WCAG measures a **contrast ratio**, from 1:1 (same colour) to 21:1 (black on white), computed from the colours' relative luminance. The thresholds:

| WCAG criterion | Applies to | AA minimum |
|---|---|---|
| 1.4.3 Contrast (Minimum) | Normal text | 4.5:1 |
| 1.4.3 Contrast (Minimum) | Large text: 24px, or 18.66px bold | 3:1 |
| 1.4.11 Non-text Contrast | Control borders, icons, focus rings, chart lines | 3:1 |

Disabled controls are exempt; AAA asks 7:1 for normal text. You don't compute ratios by hand: click a colour swatch in Chrome's or Firefox's Styles panel and the colour picker shows the ratio against the background, with a pass or fail mark.

Five-dice's text colours pass in both themes, from 5.32:1 (muted grey on the light page) to 14.62:1. The pale grey `#999` often used for secondary text has 2.85:1 on white and fails.

WCAG 1.4.1: colour must not be the *only* signal, since about one man in twelve has some colour-vision deficiency. Held dice are blue but also move up and are `aria-pressed`. The current player's highlight is a colour, but the panel title says "Ada's turn", and this chapter adds `aria-current`.

## Hiding things

"Visible on screen" and "in the accessibility tree" combine four ways:

| On screen | In the tree | How | Use it for |
|---|---|---|---|
| Yes | Yes | Normal content | Almost everything |
| Yes | No | `aria-hidden="true"`; `alt=""` on images | Decorative icons, repeated information |
| No | Yes | A `visually-hidden` class | Text for screen readers only: a table caption, a live region |
| No | No | `display: none`, the `hidden` attribute, `visibility: hidden`; not rendering it | Content that isn't there for anyone yet |

`display: none` hides from everyone, so screen-reader-only text needs another trick: shrink the element to a 1-pixel box and clip it:

```css
/* Hidden on screen, but still read by screen readers. */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

`position: absolute` takes it out of the layout, `clip-path: inset(50%)` clips everything away, and `white-space: nowrap` stops the text wrapping into a tall column that some screen readers read word by word.

Never put `aria-hidden="true"` on something focusable: Tab still reaches it, and the screen reader has nothing to say.

## Testing accessibility

### By role, in every test

Testing Library ranks `getByRole` first, then `getByLabelText`, `getByPlaceholderText` and `getByText`, with `getByTestId` last. `getByRole('button', { name: 'Roll' })` also checks that Roll *is* a button with that name, so five-dice's tests have checked much of the accessibility tree since [Chapter 8](08-testing.md).

jest-dom adds matchers for the rest:

- `toHaveAccessibleName('…')` and `toHaveAccessibleDescription('…')`;
- `toHaveAttribute('aria-pressed', 'true')` for states;
- `toHaveFocus()` for focus management.

`user.tab()` and `user.keyboard()` test keyboard use, as `div-button.test.tsx` did.

### Lint

Oxlint's `jsx-a11y` plugin flags images without `alt`, click handlers on divs, unnamed controls and more. Five-dice's `.oxlintrc.json` doesn't enable it; try it in the examples folder:

```console
$ npx oxlint --jsx-a11y-plugin ch15

  ! jsx-a11y(prefer-tag-over-role): Prefer `output` over `role` attribute `status`.
    ,-[ch15/live-region.demo.tsx:18:10]
 17 |           and read the new text without moving focus. */}
 18 |       <p role="status">{message}</p>
    :          ^^^^^^^^^^^^^
 19 |     </main>
    `----
  help: Replace HTML elements with `role` attribute `status` to corresponding semantic HTML tag `output`.

  ! jsx-a11y(click-events-have-key-events): Enforce a clickable non-interactive element has at least one keyboard event listener.
    ,-[ch15/div-button.demo.tsx:10:7]
  ...
  ! jsx-a11y(no-static-element-interactions): Static HTML elements with event handlers require a role.
    ,-[ch15/div-button.demo.tsx:10:8]
  ...
  ! jsx-a11y(control-has-associated-label): A control must be associated with a text label.
    ,-[ch15/names.test.tsx:23:7]
  ...

Found 4 warnings and 0 errors.
Finished in 11ms on 7 files with 151 rules using 32 threads.
```

It found the fake button and the unnamed icon button. The first warning is taste: `role="status"` on a `<p>` is fine ([Live regions](#live-regions)). The help text for the div, "add a keyboard listener" or "add a role", suggests worse fixes than the real one, a `<button>`.

### Automated checkers, and their limits

**axe**, the most used checker, runs as a browser extension (axe DevTools), in Chrome's Lighthouse panel and in tests. It finds missing names and `alt`, low contrast, broken ARIA and more.

In tests it comes wrapped for your runner: `jest-axe`, or `vitest-axe` for Vitest. Neither is installed in this course; this sketch, from vitest-axe's README, only shows the shape:

```tsx
// Illustrative only: not part of the examples or five-dice.
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import { expect, it } from 'vitest'
import App from './App'

expect.extend(matchers)

it('has no axe violations on first render', async () => {
  const { container } = render(<App />)
  expect(await axe(container)).toHaveNoViolations()
})
```

It checks one rendered state, the one the test produces, and jsdom has no layout, so contrast checks can't run there.

But it finds only some problems. axe-core 4.14 reports **no violations** in the Chapter 14 game, which has score buttons named "30", silent rolls, no row headers, and the current player shown by colour alone. A checker sees that a button has *a* name; only a person can tell "30" isn't useful. So test by hand too:

- **Keyboard only.** Play a game without the mouse. Can you reach everything and always see the focus?
- **A screen reader.** Narrator on Windows (Win+Ctrl+Enter) or the free NVDA, VoiceOver on macOS (Cmd+F5), Orca on Linux (Super+Alt+S in GNOME). Use it eyes closed for five minutes.
- **Zoom to 200%.** Chapter 14's layout should still work (WCAG 1.4.4).

## Building five-dice: an accessibility pass

Five-dice starts well: real dice buttons with `aria-label` and `aria-pressed` (Chapter 5), labelled form fields (Chapter 9), focus moved to the result and back to Roll (Chapter 12), and tests by role. A screen reader and keyboard still reveal:

| Problem | Who it hurts | Fix |
|---|---|---|
| After a roll, nothing is said. The new dice are elsewhere on the page | Screen reader users | A live region announces rolls and scores |
| The panels are plain `<section>`s, so there's no landmark to jump to | Screen reader users | Name each section after its heading |
| A score button is called just "30" | Screen reader and voice-control users | Name it "Score 30 in Sixes" |
| The scorecard's category names are ordinary cells, and the table has no name | Screen reader users | `<th scope="row">`, `scope="col"`, a `<caption>` |
| Whose turn it is shows only as a highlight colour | Screen reader users | `aria-current` on the highlighted row and column |
| The shortcuts are only in a line of small text | Screen reader users | `aria-keyshortcuts` |
| The focus ring is whatever the browser draws | Keyboard users | A thick ring in the accent colour |
| Start game, Play again and New game drop focus to `<body>` | Keyboard and screen reader users | Focus the new screen's heading |

The files that change:

| File | Change |
|---|---|
| `src/game/reducer.ts` | The state remembers the last roll or score |
| `src/components/Announcer.tsx` | New: the live region |
| `src/components/Game.tsx` | Renders the announcer; passes a heading ref to the first panel |
| `src/components/Panel.tsx` | Each panel is a named region; its heading can take focus |
| `src/components/Scorecard.tsx` | Table headers, a caption, named score buttons, `aria-current` |
| `src/components/Scoreboard.tsx` and `.module.css` | `aria-current`, and CSS that styles it |
| `src/components/Die.tsx`, `DiceTray.tsx` | `aria-keyshortcuts` |
| `src/components/HighScores.tsx` | `scope="col"` |
| `src/index.css` | `.visually-hidden` and `:focus-visible` |
| `src/App.tsx` | Moves focus to the new screen's heading |
| `src/App.test.tsx` | Four accessibility tests and a focus check; one test checks `aria-current` instead of a class |

### What just happened: `lastEvent`

To announce "Ada rolled 6, 6, 3, 2, 1", something must know what just happened. The reducer does, so it records each roll and score in the state as a `GameEvent`.

In `src/game/reducer.ts`, add a field to `GameState` and a new type below it:

```ts
export interface GameState {
  players: Player[]
  /** Index into `players` of whoever's turn it is. */
  current: number
  dice: Die[]
  rollsLeft: number
  settings: Settings
  /** What just happened, for screen-reader announcements. null at the start. */
  lastEvent: GameEvent | null
}

export type GameEvent =
  | { type: 'rolled'; player: string; values: DieValue[]; rollsLeft: number }
  | { type: 'scored'; player: string; category: Category; points: number; bonus: boolean }
```

In `createGame`, start with no event:

```ts
    settings: setup.settings,
    lastEvent: null,
  }
```

The `roll` case builds the new dice first, since the event needs their values:

```ts
    case 'roll': {
      if (phase !== 'ready' && phase !== 'rolling') return state
      const dice = applyRoll(state.dice, action.values)
      const rollsLeft = state.rollsLeft - 1
      return {
        ...state,
        dice,
        rollsLeft,
        lastEvent: {
          type: 'rolled',
          player: state.players[state.current].name,
          values: dice.map((die) => die.value),
          rollsLeft,
        },
      }
    }
```

The `score` case adds the event at the end of the object it returns:

```ts
        dice: createDice(),
        rollsLeft: MAX_ROLLS,
        lastEvent: {
          type: 'scored',
          player: player.name,
          category: action.category,
          points: sheet.scores[action.category] ?? 0,
          bonus: sheet.fiveOfAKindBonuses > player.sheet.fiveOfAKindBonuses,
        },
      }
```

`sheet` is the player's new score sheet and `player.sheet` the old one, so a bonus was earned if the count went up. `?? 0` is only for TypeScript: `scores[category]` is `number | undefined`, but the category was just filled in.

Why store it? Otherwise the component would need a ref to the previous state and guesswork to infer what happened. The event holds facts; the component turns them into a sentence, so wording stays out of the reducer.

A game saved by Chapter 14's version has no `lastEvent`. `loadGame` doesn't check that field, so the save still loads (with `lastEvent` `undefined`) and the storage key needn't change. The component below tests `lastEvent ?`, treating `undefined` like `null`.

### The announcer

A new component turns the last event into a sentence in a live region.

`src/components/Announcer.tsx`

```tsx
import type { GameEvent } from '../game/reducer'
import { CATEGORY_LABELS } from '../game/rules'
import { useGameState } from '../hooks/useGame'

function announcement(event: GameEvent): string {
  switch (event.type) {
    case 'rolled': {
      const { rollsLeft } = event
      const rolls =
        rollsLeft === 0 ? 'That was the last roll.' : `${rollsLeft} ${rollsLeft === 1 ? 'roll' : 'rolls'} left.`
      return `${event.player} rolled ${event.values.join(', ')}. ${rolls}`
    }
    case 'scored': {
      const bonus = event.bonus ? ' Five of a Kind bonus: plus 100!' : ''
      return `${event.player} scored ${event.points} in ${CATEGORY_LABELS[event.category]}.${bonus}`
    }
  }
}

/**
 * A live region: screen readers read out changes to its text, without moving
 * focus. It must already be on the page before the text changes, so it is
 * always rendered, and empty until something happens.
 */
export function Announcer() {
  const { lastEvent } = useGameState()

  return (
    <p role="status" className="visually-hidden">
      {lastEvent ? announcement(lastEvent) : ''}
    </p>
  )
}
```

- The `switch` covers both members of the `GameEvent` union, so TypeScript needs no `default` or final `return` ([TypeScript Crash Course, chapter 5](https://github.com/sipak-gh/learn-typescript-crashcourse/blob/master/05-unions-and-narrowing.md#discriminated-unions)).
- The region is `visually-hidden`: sighted players see the changes already.
- Every event is read: a roll changes the text (rolls left drop), and a score replaces a roll's text.

In `src/components/Game.tsx`, import it and render it at the end of `<main>`:

```tsx
import { Announcer } from './Announcer'
```

```tsx
      <Panel title="Scorecard">
        <Scorecard onScore={handleScore} />
      </Panel>

      <Announcer />
    </main>
```

`<main>` and the announcer render when the game starts, so the region exists, empty, before the first roll. `Game` still renders at game over, so the last score is announced.

### Panels as landmarks

A `<section>` becomes a `region` landmark once named. `aria-labelledby` names it after its heading, which needs a page-unique `id`; with several panels, [Chapter 9](09-forms.md)'s `useId` provides one each.

`src/components/Panel.tsx`

```tsx
import { useId, type ReactNode } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  title: string
  /** Whatever JSX is nested between <Panel> and </Panel>. */
  children: ReactNode
}

export function Panel({ title, children }: PanelProps) {
  const titleId = useId()
  return (
    // A <section> with an accessible name is a "region" landmark: screen
    // reader users can jump straight to it, e.g. to "Scorecard".
    <section className={styles.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {children}
    </section>
  )
}
```

The page now has a banner (`<header>`), main, a footer (`contentinfo`), and inside main a region per panel: "Ada's turn" (renamed each turn), "Standings", "Scorecard" and, at game end, "High scores".

### The scorecard as a real table

Three changes in `src/components/Scorecard.tsx`:

- A screen reader user moving between score buttons hears only numbers like "30". `ScoreCell` gets the category's label and names the button "Score 30 in Sixes". The visible "30" is part of the name, so voice control still works (WCAG 2.5.3).
- The row labels become row headers, `<th scope="row">`, in both row helpers.
- The table gets a caption and column scopes. The current player's column header gets `aria-current`, matching its highlight.

```diff
 interface ScoreCellProps {
+  label: string
   score: number | undefined
@@
-function ScoreCell({ score, potential, isCurrent, onScore }: ScoreCellProps) {
+function ScoreCell({ label, score, potential, isCurrent, onScore }: ScoreCellProps) {
@@
     content = (
-      <button type="button" className={styles.scoreButton} onClick={onScore}>
+      // Out of context, "12" means little: the accessible name says it all.
+      <button type="button" className={styles.scoreButton} onClick={onScore} aria-label={`Score ${potential} in ${label}`}>
         {potential}
@@
   const renderRow = (category: Category) => (
     <tr key={category}>
-      <td>{CATEGORY_LABELS[category]}</td>
+      <th scope="row">{CATEGORY_LABELS[category]}</th>
       {players.map((player, index) => (
         <ScoreCell
           key={player.name}
+          label={CATEGORY_LABELS[category]}
           score={player.sheet.scores[category]}
@@
     <tr className={className}>
-      <td>{label}</td>
+      <th scope="row">{label}</th>
@@
     <table className={tables.table}>
+      {/* The caption names the table for screen readers; it is hidden visually
+          because the panel title already says "Scorecard". */}
+      <caption className="visually-hidden">Scores by category, one column per player</caption>
       <thead>
         <tr>
-          <th>Category</th>
+          <th scope="col">Category</th>
           {players.map((player, index) => (
-            <th key={player.name} className={numberClass(isCurrent(index))}>
+            <th
+              key={player.name}
+              scope="col"
+              className={numberClass(isCurrent(index))}
+              aria-current={isCurrent(index)}
+            >
               {player.name}
```

Now a screen reader says "Sixes, row header" on a label and "Bo, 18" moving across to Bo's column; the caption explains the layout up front. Category names turn bold, as browsers bold `<th>`; `tables.module.css` already aligns `th` left.

### Whose turn it is: `aria-current`

The Standings highlight is colour only. `aria-current` says "the current one in the set"; styling the attribute instead of a class keeps meaning and look in sync.

In `src/components/Scoreboard.tsx`:

```diff
       {rankPlayers(state.players).map((standing) => (
-        <li key={standing.name} className={standing.name === current ? styles.current : undefined}>
+        // aria-current tells screen readers what the highlight shows: whose turn it is.
+        <li key={standing.name} aria-current={standing.name === current}>
```

In `src/components/Scoreboard.module.css`, the last rule selects the attribute instead of the `.current` class:

```css
.list [aria-current='true'] {
  background: var(--color-highlight);
}
```

React writes `aria-current="false"` on the other rows (equivalent to no attribute), so the selector must match the value `'true'`, not just the attribute's presence.

Other values: `"page"` (the current link in a menu), `"step"`, `"date"`, `"time"`, `"location"`; `true` is a plain "current item".

### Advertising the shortcuts

`aria-keyshortcuts` lists the keys that activate an element; some screen readers read it out, so users needn't see the hint text. It's only a label: `useKeyboardShortcuts` handles the keys.

In `src/components/Die.tsx`, add an optional prop and pass it through:

```tsx
  onToggle: () => void
  /** The key that toggles this die, announced via aria-keyshortcuts. */
  shortcut?: string
  /** React 19: `ref` is an ordinary prop for function components (no forwardRef). */
  ref?: Ref<HTMLButtonElement>
}

export function Die({ value, held, disabled, onToggle, shortcut, ref }: DieProps) {
```

```tsx
      aria-label={`Die showing ${value}`}
      aria-pressed={held}
      aria-keyshortcuts={shortcut}
      onClick={onToggle}
```

When `shortcut` is `undefined`, React omits the attribute, so the `Die.test.tsx` snapshot doesn't change.

In `src/components/DiceTray.tsx`, give each die and the Roll button its key:

```tsx
            onToggle={() => toggleHold(die.id)}
            shortcut={String(die.id + 1)}
```

```tsx
          onClick={roll}
          disabled={!canRoll}
          aria-keyshortcuts="Space"
        >
          Roll
        </button>
```

Values use the ARIA spec's key names: `"Space"`, `"1"`, or combinations like `"Control+S"`.

### Global CSS: hidden text and focus

`src/index.css` gets two global rules after `.hint` in section 4: one for the announcer and caption, one for every focusable element:

```css
/* Hidden on screen, but still read by screen readers. */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* A clear focus ring, shown when focus came from the keyboard. */
:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}
```

Both are global on purpose: `visually-hidden` is a utility, and the focus ring should look the same everywhere. It uses the accent colour, light blue in the dark theme: 5.16:1 on the light page and 7.46:1 on the dark one, well over WCAG 1.4.11's 3:1 for focus indicators.

### The high-score table

In `src/components/HighScores.tsx`, the header cells get `scope="col"`:

```tsx
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Name</th>
          <th scope="col" className={tables.number}>
            Score
          </th>
          <th scope="col">Date</th>
        </tr>
      </thead>
```

Browsers usually infer the scope of a table this simple; writing it costs nothing and removes the guess.

### Focus when the screen changes

Start game, Play again and New game each replace the screen, and the button disappears with it ([Focus when the screen changes](#focus-when-the-screen-changes)). `App` swaps the screens, so it owns one heading ref; the board's heading is in `Panel`, two components down, so the ref travels as a prop.

In `src/components/Panel.tsx`, accept a `titleRef` and pass it to the heading. Only a panel given a ref becomes focusable:

```diff
-import { useId, type ReactNode } from 'react'
+import { useId, type ReactNode, type Ref } from 'react'
 import styles from './Panel.module.css'
 
 interface PanelProps {
   title: string
+  /** Pass a ref to move focus to the title from code. */
+  titleRef?: Ref<HTMLHeadingElement>
   /** Whatever JSX is nested between <Panel> and </Panel>. */
   children: ReactNode
 }
 
-export function Panel({ title, children }: PanelProps) {
+export function Panel({ title, titleRef, children }: PanelProps) {
@@
     <section className={styles.panel} aria-labelledby={titleId}>
-      <h2 id={titleId} className={styles.title}>
+      {/* tabIndex={-1}: focusable from code, but not a Tab stop. */}
+      <h2 id={titleId} ref={titleRef} tabIndex={titleRef ? -1 : undefined} className={styles.title}>
```

In `src/components/Game.tsx`, pass it on to the first panel, the one titled "Ada's turn" or "Game over":

```diff
-import { useRef } from 'react'
+import { useRef, type Ref } from 'react'
@@
 interface GameProps {
   onPlayAgain: () => void
+  /** Attached to the board's first heading, so App can move focus there. */
+  headingRef?: Ref<HTMLHeadingElement>
 }
 
 /** Lays out the board. The pieces read the game from context themselves. */
-export function Game({ onPlayAgain }: GameProps) {
+export function Game({ onPlayAgain, headingRef }: GameProps) {
@@
-        <Panel title={phase === 'gameOver' ? 'Game over' : `${player.name}'s turn`}>
+        <Panel title={phase === 'gameOver' ? 'Game over' : `${player.name}'s turn`} titleRef={headingRef}>
```

In `src/App.tsx`, create the ref, attach it to the "New game" heading and the board, and route every screen change through one function:

```diff
-import { useState } from 'react'
+import { useRef, useState } from 'react'
+import { flushSync } from 'react-dom'
@@
   const [session, setSession] = useState(resumeSession)
 
+  // The heading of whichever screen is showing: "New game", or the board's first panel.
+  const headingRef = useRef<HTMLHeadingElement>(null)
+
+  /** Swap screens with `update`, then move focus to the new screen's heading. */
+  function changeScreen(update: () => void) {
+    // The button that was just pressed is about to disappear, which would drop
+    // focus to <body>. flushSync puts the new screen on the page right now, so
+    // its heading is there to focus.
+    flushSync(update)
+    headingRef.current?.focus()
+  }
+
+  function handleStart(setup: GameSetup) {
+    changeScreen(() => setSession({ id: 1, setup }))
+  }
+
   function handlePlayAgain() {
     // Same players and options, new id. The new `key` below makes React throw
     // away the old <GameProvider> and its state, and mount a fresh one.
-    setSession((current) => current && { id: current.id + 1, setup: current.setup })
+    changeScreen(() => setSession((current) => current && { id: current.id + 1, setup: current.setup }))
   }
@@
     clearSavedGame()
-    setSession(null)
+    changeScreen(() => setSession(null))
   }
@@
-          <Game onPlayAgain={handlePlayAgain} />
+          <Game onPlayAgain={handlePlayAgain} headingRef={headingRef} />
         </GameProvider>
       ) : (
         <main className={styles.setup}>
-          <h2>New game</h2>
-          <NewGameForm onStart={(setup) => setSession({ id: 1, setup })} />
+          <h2 ref={headingRef} tabIndex={-1}>
+            New game
+          </h2>
+          <NewGameForm onStart={handleStart} />
```

- Play again keeps the board on screen but remounts it under a new `key`, so the Game over panel and its button are replaced too.
- A saved game resumed on page load gets no focus move: no handler ran, and that's what you want on load.
- The "High scores" heading on the setup screen stays unfocusable: only the screen's first heading needs it.

### The tests

In `src/App.test.tsx`, the turn test checked the column highlight via the CSS Module class (Chapter 14). Now it can check what a screen reader perceives. Remove the `scorecardStyles` import and change the checks:

```tsx
    // Test what users perceive: aria-current, not a CSS class.
    expect(columnHeader('Player 1')).toHaveAttribute('aria-current', 'true')
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(scoreButton('Sixes'))

    expect(screen.getByRole('heading', { name: "Player 2's turn" })).toBeInTheDocument()
    expect(columnHeader('Player 2')).toHaveAttribute('aria-current', 'true')
    expect(columnHeader('Player 1')).toHaveAttribute('aria-current', 'false')
```

`scoreButton` still works: it finds the row by label and takes the button inside, whatever its name. In the test that plays 13 turns, check where Play again leaves focus:

```diff
     await user.click(screen.getByRole('button', { name: 'Play again' }))
     expect(screen.getByRole('row', { name: 'Total 0' })).toBeInTheDocument()
+    expect(screen.getByRole('heading', { name: "Player 1's turn" })).toHaveFocus()
   })
```

Add four tests at the end of the `App` block, in their own `describe`:

```tsx
  describe('accessibility', () => {
    it('announces rolls and scores in a live region', async () => {
      const user = await startGame(fakeDice(6, 6, 6, 5, 5))
      const status = screen.getByRole('status')
      expect(status).toBeEmptyDOMElement()

      await user.click(screen.getByRole('button', { name: 'Roll' }))
      expect(status).toHaveTextContent('Player 1 rolled 6, 6, 6, 5, 5. 2 rolls left.')

      await user.click(screen.getByRole('button', { name: 'Score 25 in Full House' }))
      expect(status).toHaveTextContent('Player 1 scored 25 in Full House.')
    })

    it('gives the board landmarks and the scorecard table headers', async () => {
      const user = await startGame(fakeDice(6))
      for (const name of ["Player 1's turn", 'Standings', 'Scorecard']) {
        expect(screen.getByRole('region', { name })).toBeInTheDocument()
      }
      const table = screen.getByRole('table', { name: 'Scores by category, one column per player' })
      expect(within(table).getByRole('columnheader', { name: 'Player 1' })).toBeInTheDocument()
      expect(within(table).getByRole('rowheader', { name: 'Sixes' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Roll' }))
      expect(screen.getByRole('button', { name: 'Score 30 in Sixes' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Score 50 in Five of a Kind' })).toBeInTheDocument()
    })

    it("moves focus to the new screen's heading", async () => {
      const user = await startGame()
      expect(screen.getByRole('heading', { name: "Player 1's turn" })).toHaveFocus()

      await user.click(screen.getByRole('button', { name: 'New game' }))
      expect(screen.getByRole('heading', { name: 'New game' })).toHaveFocus()
    })

    it('can play a turn with Tab, Enter and Space alone', async () => {
      const user = await startGame(fakeDice(6))
      const roll = screen.getByRole('button', { name: 'Roll' })
      // Tab through the page until we reach the Roll button.
      for (let i = 0; i < 10 && document.activeElement !== roll; i++) await user.tab()
      expect(roll).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(screen.getByText(/Rolls left: 2/)).toBeInTheDocument()

      // Shift+Tab goes back to the last die; Space on a button presses it.
      await user.tab({ shift: true })
      expect(document.activeElement).toHaveAccessibleName('Die showing 6')
      await user.keyboard(' ')
      expect(document.activeElement).toHaveAttribute('aria-pressed', 'true')

      // Forward past Roll to the first score button, and score with Enter.
      await user.tab()
      await user.tab()
      expect(document.activeElement).toHaveAccessibleName('Score 0 in Ones')
      await user.keyboard('{Enter}')
      expect(screen.getByRole('row', { name: 'Ones 0' })).toBeInTheDocument()
      expect(roll).toHaveFocus()
    })
  })
```

- The first fixes the dice to 6, 6, 6, 5, 5 (a Full House) and reads the live region after each step.
- The second checks structure: three regions, the caption-named table, row and column headers. `within` limits a query to one element.
- The third follows focus through two screen changes. Without `flushSync` in `changeScreen`, both checks fail: focus is on `<body>`.
- The fourth plays a turn without `user.click`. It tabs until it reaches Roll (at most ten times) rather than hard-coding a count, then checks each control is reachable and works, and that focus returns to Roll after scoring (Chapter 12). Shift+Tab from Roll lands on the last die, because the dice were disabled, and so skipped, before the roll. Such a test cheaply catches Tab-order changes.

### Checkpoint

```console
$ npm test
...
 ✓ src/App.test.tsx (19 tests) 3417ms
...
 Test Files  10 passed (10)
      Tests  83 passed (83)

$ npm run build
...
✓ 54 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-O_RImjVc.css    6.06 kB │ gzip:  1.70 kB
dist/assets/index-DBBassLB.js   236.25 kB │ gzip: 74.42 kB
```

```console
$ npm run lint

> five-dice@0.0.0 lint
> oxlint

Found 0 warnings and 0 errors.
Finished in 14ms on 41 files with 116 rules using 32 threads.
```

Timings, file-name hashes and thread count vary. The build has one more module: `Announcer.tsx`. `npx oxlint --jsx-a11y-plugin` reports one warning on the project, preferring `<output>` to `role="status"` in `Announcer.tsx`.

In the browser (`npm run dev`), start a game and put the mouse aside:

- Start game with Enter: focus lands on the "Player 1's turn" heading (no Tab stop of its own). Tab: a thick blue ring moves to Roll, skipping the dice (disabled until you roll), then on through the score buttons. Shift+Tab from Roll goes back to New game and the Theme menu.
- Enter on Roll: the dice change and focus stays. Shift+Tab reaches the last die; Space holds it.
- Click Roll with the mouse: focus, but no ring (`:focus-visible`).
- The scorecard's category names are bold `<th>`s.
- In devtools, `<main>` ends with `<p role="status" class="visually-hidden">Player 1 rolled 3, 4, 4, 5, 5. 2 rolls left.</p>` (your numbers differ). A score button's name in the Accessibility tab is "Score … in …".

With your OS's screen reader on, a turn reads the dice after each roll, the points after each score, and the headers with each scorecard cell.

The complete project at this point is in `project/ch15/`.

## Summary

- Aim for WCAG 2.2 AA: usable by screen reader, keyboard alone, zoomed, and without relying on colour.
- Assistive technology reads the accessibility tree: role, name, states, description.
- Use the element that means what you want; a `<div>` isn't a `<button>`.
- Name every control (content, `<label>`, `alt`, `<caption>`, `aria-label`, `aria-labelledby`), including the visible text. `alt=""` marks decoration.
- ARIA changes only the tree, never behaviour; use it for what HTML can't say. No ARIA beats bad ARIA.
- A live region (`role="status"`) announces text changes without moving focus; render it first. React skips a DOM update for the same string, so make each message differ.
- Tab order is DOM order; `tabIndex={-1}` allows focus from code. Style `:focus-visible`; never just remove the outline.
- When a click swaps the screen, focus the new screen's heading, or focus falls to `<body>`.
- Contrast: 4.5:1 for text (3:1 large), 3:1 for controls and focus rings.
- `.visually-hidden` hides from eyes only; `aria-hidden` from the tree only.
- Test by role and keyboard. Linters and axe catch only some problems: try a keyboard and screen reader yourself.

## Exercises

1. **Fix a component.** This card has four accessibility problems a linter can find and one it can't. Fix all five in `examples/ch15/player-card.tsx`, and write a test that uses the card by role, name and keyboard only.

   ```tsx
   export function PlayerCard({ onSave, onDelete }: { onSave: () => void; onDelete: () => void }) {
     return (
       <div className="card">
         <img src="avatar.png" />
         <input placeholder="Name" />
         <div className="button" onClick={onSave}>
           Save
         </div>
         <button type="button" onClick={onDelete}>
           <svg width="16" height="16" viewBox="0 0 16 16">
             <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" />
           </svg>
         </button>
       </div>
     )
   }
   ```

   <details><summary>Solution</summary>

   `npx oxlint --jsx-a11y-plugin ch15/player-card.tsx` finds four: the image has no `alt` (`alt-text`), the div has a click handler but no keyboard handler and no role (`click-events-have-key-events`, `no-static-element-interactions`), and the icon button has no name (`control-has-associated-label`). It doesn't flag the fifth: the input has a placeholder but no label.

   ```tsx
   export function PlayerCard({ onSave, onDelete }: { onSave: () => void; onDelete: () => void }) {
     return (
       <div className="card">
         {/* Decorative: the name next to it says who it is. */}
         <img src="avatar.png" alt="" />
         <label>
           Name <input name="name" />
         </label>
         <button type="button" onClick={onSave}>
           Save
         </button>
         <button type="button" onClick={onDelete} aria-label="Delete player">
           <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
             <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" />
           </svg>
         </button>
       </div>
     )
   }
   ```

   - The avatar beside the player's name adds nothing for a screen reader, so `alt=""`. If the image were the only place the name appeared, it would need `alt="Ada"`.
   - The `<label>` gives the input a name that stays visible while typing.
   - The div becomes a `<button>`. Don't follow the linter's hint and bolt a role and key handlers onto the div.
   - The icon button gets a name, and the icon leaves the tree.

   `examples/ch15/player-card.test.tsx`

   ```tsx
   import { render, screen } from '@testing-library/react'
   import userEvent from '@testing-library/user-event'
   import { expect, it, vi } from 'vitest'
   import { PlayerCard } from './player-card'

   it('is usable by role and name, and from the keyboard', async () => {
     const user = userEvent.setup()
     const onSave = vi.fn()
     const onDelete = vi.fn()
     render(<PlayerCard onSave={onSave} onDelete={onDelete} />)

     await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada')
     await user.tab()
     expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()
     await user.keyboard('{Enter}')
     expect(onSave).toHaveBeenCalled()

     await user.click(screen.getByRole('button', { name: 'Delete player' }))
     expect(onDelete).toHaveBeenCalled()
     // alt="" removes the image from the accessibility tree.
     expect(screen.queryByRole('img')).not.toBeInTheDocument()
   })
   ```

   The test passes, and the linter finds nothing in the file. Against the original card, the first line already fails: there's no textbox named "Name".

   </details>

2. **Describe the Roll button.** The text next to Roll says what to do now ("Roll to start your turn. Rolls left: 3"), but a screen reader user on the button doesn't hear it. Make it the button's accessible description, and test it.

   <details><summary>Solution</summary>

   `aria-describedby` points at the element whose text is the description. Like `aria-labelledby`, it needs an `id`, so use `useId` again. In `src/components/DiceTray.tsx`, add `useId` to the React import:

   ```tsx
   import { useContext, useId, useRef, type Ref } from 'react'
   ```

   After `useKeyboardShortcuts(shortcuts)`:

   ```tsx
     const hintId = useId()
   ```

   On the Roll button, after `aria-keyshortcuts="Space"`:

   ```tsx
             aria-describedby={hintId}
   ```

   And on the paragraph next to it:

   ```tsx
           <p id={hintId}>
             {HINTS[phase]} Rolls left: {state.rollsLeft}
           </p>
   ```

   In the `accessibility` block of `src/App.test.tsx`:

   ```tsx
       it('describes the Roll button with the hint next to it', async () => {
         const user = await startGame(fakeDice(6))
         const roll = screen.getByRole('button', { name: 'Roll' })
         expect(roll).toHaveAccessibleDescription('Roll to start your turn. Rolls left: 3')

         await user.click(roll)
         expect(roll).toHaveAccessibleDescription(
           'Click a die to hold it, roll again, or pick a score. Rolls left: 2',
         )
       })
   ```

   It's read after name and role ("Roll, button, Roll to start your turn. Rolls left: 3") and follows the text as the phase changes. `npm test` reports 84 tests.

   </details>

3. **Say it again.** In `examples/ch15/live-region.demo.tsx`, rolling the same number twice says nothing the second time ([The same message twice](#the-same-message-twice)). Make every roll change the region's text, and change the second test in `live-region.test.tsx` to prove it.

   <details><summary>Solution</summary>

   Count the rolls and put the count in the message, so no two messages are the same. The count and the value change together, so they share one state object:

   ```tsx
   import { useState } from 'react'

   interface Roll {
     count: number
     value: number
   }

   export default function LiveRegionDemo() {
     const [roll, setRoll] = useState<Roll | null>(null)

     function rollDie() {
       const value = Math.floor(Math.random() * 6) + 1
       setRoll((previous) => ({ count: (previous?.count ?? 0) + 1, value }))
     }

     return (
       <main>
         <button type="button" onClick={rollDie}>
           Roll
         </button>
         {/* The roll number makes every message differ from the last. */}
         <p role="status">{roll && `Roll ${roll.count}: you rolled ${roll.value}.`}</p>
       </main>
     )
   }
   ```

   In the second test, rename it and replace the end:

   ```tsx
   it('changes the region even when the same number comes up twice', async () => {
     // ...as before, up to the first click...
     await user.click(screen.getByRole('button', { name: 'Roll' }))
     expect(status).toHaveTextContent('Roll 1: you rolled 4.')
     const afterFirstRoll = changes.length

     await user.click(screen.getByRole('button', { name: 'Roll' }))
     expect(status).toHaveTextContent('Roll 2: you rolled 4.')
     expect(changes.length).toBeGreaterThan(afterFirstRoll)
   })
   ```

   The first test now fails, because the message changed: update it to expect `'Roll 1: you rolled 4.'`. Don't reach for `key` on the `<p>` instead: a new key makes a new element, and a live region must already be on the page before its text changes.

   </details>

4. **A skip link.** Keyboard users must Tab through the header to reach the game. Add a "Skip to main content" link as the first thing on the page, invisible until focused, that jumps to `<main>`. Test it.

   <details><summary>Solution</summary>

   In `src/App.tsx`, as the first child of the `.app` div:

   ```tsx
         {/* The first Tab stop: lets keyboard users jump over the header. */}
         <a className="skip-link" href="#main">
           Skip to main content
         </a>
   ```

   Both `<main>` elements need the `id`: the new-game screen's, in the same file,

   ```tsx
           <main id="main" className={styles.setup}>
   ```

   and the board's, in `src/components/Game.tsx`:

   ```tsx
       <main id="main" className={styles.board}>
   ```

   Only one is on the page at a time, so the `id` stays unique. In `src/index.css`, before the `:focus-visible` rule:

   ```css
   /* A skip link: above the top of the page until it has focus. */
   .skip-link {
     position: absolute;
     top: var(--space-2);
     left: var(--space-2);
     padding: var(--space-2) var(--space-3);
     background: var(--color-surface);
     transform: translateY(-200%);
   }

   .skip-link:focus {
     transform: none;
   }
   ```

   The link is moved off-screen, not hidden with `display: none`, which would also remove it from the Tab order. In the `accessibility` tests:

   ```tsx
       it('starts with a skip link to the main content', async () => {
         const user = userEvent.setup()
         renderApp()
         await user.tab()
         const skip = screen.getByRole('link', { name: 'Skip to main content' })
         expect(skip).toHaveFocus()
         expect(skip).toHaveAttribute('href', '#main')
         expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
       })
   ```

   This chapter's keyboard test still passes: it tabs until it reaches Roll. In the browser, Tab shows the link top-left; Enter, then Tab, focuses the first player's name. `npm test` reports 84 tests. With two header controls the gain is small, but behind a long menu it saves dozens of key presses. It's one way to meet WCAG 2.4.1 ("Bypass Blocks"); landmarks are another.

   </details>

5. **Shortcuts you can turn off.** WCAG 2.1.4 says single-key shortcuts must be possible to turn off (or remap, or limit to a focused control). Replace the "Keyboard: …" hint below the dice with a checkbox that turns the shortcuts on and off. Remember the choice across games, and stop advertising the keys when they're off.

   <details><summary>Solution</summary>

   [Chapter 13](13-custom-hooks.md)'s `useLocalStorage` remembers the choice, and `useKeyboardShortcuts` gets an empty map when shortcuts are off. In `src/components/DiceTray.tsx`, import the hook:

   ```tsx
   import { useLocalStorage } from '../hooks/useLocalStorage'
   ```

   Replace `useKeyboardShortcuts(shortcuts)` with:

   ```tsx
     const [shortcutsOn, setShortcutsOn] = useLocalStorage('five-dice:shortcuts:v1', true)
     useKeyboardShortcuts(shortcutsOn ? shortcuts : {})
   ```

   Advertise the keys only when they work, on the dice and on Roll:

   ```tsx
               shortcut={shortcutsOn ? String(die.id + 1) : undefined}
   ```

   ```tsx
             aria-keyshortcuts={shortcutsOn ? 'Space' : undefined}
   ```

   And replace the hint paragraph at the end with a labelled checkbox:

   ```tsx
         <label className="hint">
           <input type="checkbox" checked={shortcutsOn} onChange={(event) => setShortcutsOn(event.target.checked)} />{' '}
           Keyboard shortcuts: Space rolls, 1–5 hold dice
         </label>
   ```

   A test, in the `accessibility` block:

   ```tsx
       it('lets players turn the keyboard shortcuts off', async () => {
         const user = await startGame(fakeDice(6))
         await user.click(screen.getByRole('checkbox', { name: /Keyboard shortcuts/ }))
         // Click somewhere else, so that Space doesn't toggle the checkbox back.
         await user.click(screen.getByRole('heading', { name: "Player 1's turn" }))
         await user.keyboard(' ')
         expect(screen.getByText(/Rolls left: 3/)).toBeInTheDocument()
         expect(screen.getByRole('button', { name: 'Roll' })).not.toHaveAttribute('aria-keyshortcuts')
       })
   ```

   Run the tests, and the keyboard test from this chapter fails:

   ```text
   Expected element to have accessible name:
     Score 0 in Ones
   Received:
     Keyboard shortcuts: Space rolls, 1–5 hold dice
   ```

   The checkbox is a new Tab stop between Roll and the scorecard: the test is doing its job by noticing the Tab order changed. Add one more Tab:

   ```tsx
         await user.tab()
         await user.tab() // the new checkbox is a Tab stop too
         await user.tab()
         expect(document.activeElement).toHaveAccessibleName('Score 0 in Ones')
   ```

   `npm test` reports 84 tests. Chapter 11's keyboard test still passes: shortcuts are on by default, and `test/setup.ts` clears `localStorage` after each test.

   </details>

Sources for this chapter: [REFERENCES.md](REFERENCES.md#chapter-15--accessibility)
