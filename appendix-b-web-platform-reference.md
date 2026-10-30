# Appendix B — Web Platform Beyond the Basics

The web platform features this course uses beyond W3Schools-level HTML, CSS and DOM, plus short refreshers on
the mechanisms React builds on: the cascade, event delegation, `innerHTML` versus text, the event loop,
reference equality and closures. Basic elements, selectors, properties, units and DOM calls aren't listed.
Each entry links to the chapter where it's used. For details, look the name up on
[MDN Web Docs](https://developer.mozilla.org/), the reference for everything here except the tools.

## The page: `index.html`

Every Vite app starts from one HTML file. This is the finished game's ([Chapter 1](01-getting-started.md)):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Five Dice: a dice game for 1–4 players. Roll, hold and score your way through 13 turns." />
    <title>Five Dice</title>
  </head>
  <body>
    <noscript>Five Dice needs JavaScript. Please turn it on and reload the page.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

| Part | What it does |
|---|---|
| `<!doctype html>` | Use standards mode, not the old "quirks mode" |
| `lang="en"` | The page's language, for screen readers, hyphenation and translation tools |
| `<meta charset="UTF-8">` | How the bytes are encoded. Keep it first in `<head>` |
| `<meta name="viewport">` | On phones, lay the page out at the device's width instead of a desktop width |
| `<meta name="description">` | The summary search engines show ([Chapter 20](20-where-next.md)) |
| `<link rel="icon">` | The tab icon. `/favicon.svg` comes from the `public/` folder |
| `<title>` | The tab title. The game changes it at runtime with `document.title` |
| `<noscript>` | Shown only when JavaScript is off ([Chapter 20](20-where-next.md)) |
| `<div id="root">` | The empty element React renders into |
| `<script type="module">` | Loads the entry file as an ES module. Vite serves it in development and replaces it with the bundle when building |

## JSX names for HTML attributes

In JSX, attributes are props. Most keep their HTML names; these don't, or behave differently:

| JSX | HTML | Note | Chapter |
|---|---|---|---|
| `className` | `class` | CSS classes, separated by spaces | [2](02-from-vanilla-dom-to-react.md), [4](04-components-and-jsx.md) |
| `htmlFor` | `for` | Ties a `<label>` to the input with that `id` | [4](04-components-and-jsx.md), [9](09-forms.md) |
| `style={{ fontSize: '3rem' }}` | `style="font-size: 3rem"` | An object with camelCase property names | [4](04-components-and-jsx.md) |
| `defaultChecked`, `defaultValue` | `checked`, `value` | The initial state of an uncontrolled input; `checked`/`value` make it controlled | [9](09-forms.md) |
| `maxLength`, `autoComplete`, `tabIndex` | `maxlength`, `autocomplete`, `tabindex` | camelCase. `tabIndex={-1}`: focusable from code (`focus()`) but not with Tab | [9](09-forms.md), [12](12-refs-and-the-dom.md) |
| `disabled={false}` | (no attribute) | Boolean props take `true`/`false`; in HTML any value, even `"false"`, means on | [5](05-state-and-events.md) |
| `aria-*`, `data-*` | the same | Keep their dashed names | [5](05-state-and-events.md), [14](14-styling.md) |

`scope="col"` / `"row"` on a `<th>` says which cells it heads ([Chapter 15](15-accessibility.md)).

### ARIA attributes and roles

Rule one of ARIA: use a native element (`<button>`, `<dialog>`, `<table>`) when one exists. Add ARIA only to fill a
gap ([Chapter 15](15-accessibility.md)).

| Attribute | Meaning | Chapter |
|---|---|---|
| `aria-label` | The accessible name when there's no visible text, e.g. a die showing only pips | [2](02-from-vanilla-dom-to-react.md), [5](05-state-and-events.md) |
| `aria-pressed` | A toggle button's on/off state (a held die) | [2](02-from-vanilla-dom-to-react.md), [5](05-state-and-events.md) |
| `role="alert"` | A live region announced at once, interrupting the screen reader (form errors) | [9](09-forms.md) |
| `role="status"` | A polite live region, announced when the screen reader is idle (roll results) | [8](08-testing.md), [15](15-accessibility.md) |
| `aria-describedby` | Extra description read after the name (a field's error message) | [9](09-forms.md) |
| `aria-invalid` | Marks a field whose value is wrong | [9](09-forms.md) |
| `aria-hidden="true"` | Leaves decorative content, such as icons, out of the accessibility tree | [15](15-accessibility.md) |
| `aria-live` | Makes an element a live region; `role="status"` implies `aria-live="polite"` | [15](15-accessibility.md) |
| `aria-labelledby` | The accessible name is the text of the element with this id | [15](15-accessibility.md) |
| `aria-current="true"` | Marks the current item in a set (the current player) | [15](15-accessibility.md) |
| `aria-keyshortcuts` | Announces a keyboard shortcut, e.g. `"Space"` | [15](15-accessibility.md) |

## CSS beyond the basics

| Item | Meaning | Chapter |
|---|---|---|
| `--name: value`, `var(--name)` | Custom properties: inherited down the DOM tree and live, so redefining one on an element restyles everything inside. The game's design tokens and dark theme | [2](02-from-vanilla-dom-to-react.md), [14](14-styling.md) |
| `:focus-visible` | Focused, when the browser would show a focus ring (keyboard, not mouse clicks) | [15](15-accessibility.md) |
| `:has(x)` | Elements that contain `x`. `body:has(dialog[open])` = a dialog is open | [18](18-portals-and-dialogs.md) |
| `::backdrop` | The layer behind a modal `<dialog>` | [18](18-portals-and-dialogs.md) |
| `:modal` | An element that blocks the rest of the page, such as a dialog opened with `showModal()` | not used |
| `aspect-ratio` | Width-to-height ratio (square dice: `1`) | [4](04-components-and-jsx.md) |
| `color-scheme` | Tells the browser which schemes the page supports, so form controls and scrollbars match | [14](14-styling.md) |
| `position: absolute` + `overflow` + `clip-path` | The "visually hidden" class: text for screen readers only | [15](15-accessibility.md) |
| `min(a, b)` | The smaller value, e.g. `min(36rem, 100% - 2 * var(--space-3))` | [18](18-portals-and-dialogs.md) |
| `clamp(min, preferred, max)` | A value that scales but stays in bounds, e.g. `font-size: clamp(1rem, 4vw, 2rem)` | not used |
| `rgb(0 0 0 / 0.5)` | A color with transparency | [18](18-portals-and-dialogs.md) |
| `@media (prefers-color-scheme: dark)` | The user's OS is in dark mode | [13](13-custom-hooks.md) (in JS), [14](14-styling.md) (in CSS) |
| `@media (prefers-reduced-motion: reduce)` | The user asked for less animation | [12](12-refs-and-the-dom.md) (in JS), [14](14-styling.md) (in CSS) |
| `@layer name { … }` | Cascade layers: a later layer beats an earlier one whatever the specificity; styles outside any layer beat all layers | [Chapter 14](14-styling.md#which-rule-wins-import-order-and-layer) |
| `*.module.css`, `composes` | A CSS Module: Vite makes class names unique per file; `composes` includes another class's rules | [14](14-styling.md) |

"Not used" rows are features this course's game doesn't need but that you'll meet in modern CSS; look them up
on MDN.

### The cascade: which rule wins

When rules conflict, the *cascade* decides, per property, in this order: `!important` beats normal
declarations; an inline `style` beats every selector; then cascade layers, if any (`@layer`); then the more
specific selector wins (id > class > type; pseudo-classes and attribute selectors count as classes); on a tie,
the later rule wins. Inherited properties (`color`, `font-*`, custom properties) apply only where no rule sets
them on the element itself.

React adds nothing to this. A JSX `style` prop is an inline style, so it beats your stylesheet
([Chapter 2](02-from-vanilla-dom-to-react.md), [Chapter 14](14-styling.md)). The course CSS uses `!important` once, to shorten transitions under
`prefers-reduced-motion` ([Chapter 14](14-styling.md)).

## DOM and browser APIs beyond the basics

| API | What it does | Chapter |
|---|---|---|
| `localStorage.getItem/setItem/removeItem` | Strings saved per site, kept across visits. Pair with `JSON.stringify`/`JSON.parse` | [11](11-effects.md) |
| `window.matchMedia(query)` | A `MediaQueryList`: `.matches`, plus a `change` event | [12](12-refs-and-the-dom.md), [13](13-custom-hooks.md) |
| `element.animate(keyframes, options)` | Web Animations API: animate from JavaScript | [12](12-refs-and-the-dom.md) |
| `requestAnimationFrame(fn)` | Run `fn` just before the next repaint: the hook for frame-by-frame JavaScript animation | not used |
| `document.activeElement` | The element that has focus | [12](12-refs-and-the-dom.md), [15](15-accessibility.md) |
| `document.documentElement` | The `<html>` element (the game sets `data-theme` on it) | [14](14-styling.md) |
| `structuredClone(value)` | A deep copy: nothing shared with the original | [3](03-javascript-for-react.md) |
| `AbortController`, `AbortSignal` | Cancel async work: `controller.abort()` sets `signal.aborted` | [17](17-async-react.md) |
| `URLSearchParams(location.search)` | Read `?name=value` parameters from the address | [17](17-async-react.md) |
| `dialog.showModal()`, `dialog.close()`, `dialog.open` | Open a `<dialog>` as modal / close it / is it open? A modal dialog sits in the **top layer**, above everything, and makes the page behind it inert; Escape closes it | [18](18-portals-and-dialogs.md) |
| `popover` attribute, `showPopover()` | Puts a non-modal element (menu, toast) in the top layer; it closes on an outside click or Escape | [18](18-portals-and-dialogs.md) |
| `import.meta.env` | Vite's build-time variables: `DEV`, `PROD`, `MODE`, `BASE_URL` and your `VITE_*` | [19](19-building-and-shipping.md) |

Other JavaScript built-ins the course uses: `Intl.ListFormat` ("A and B") in
[Chapter 10](10-composition-and-context.md); `Map` in [Chapter 12](12-refs-and-the-dom.md);
`Date.prototype.toISOString` in [Chapter 13](13-custom-hooks.md).

### `textContent`, `innerHTML` and JSX escaping

`textContent = s` puts `s` on the page as text. `innerHTML = s` parses `s` as HTML, so user input in it can
inject markup that runs code (`<img src=x onerror="…">`). JSX's `{value}` works like `textContent`: React
always inserts it as text, so user input can't inject anything. The escape hatch, `dangerouslySetInnerHTML`,
is named to make you stop and think ([Chapter 4](04-components-and-jsx.md)).

## Events

| Event | Fires when | Chapter |
|---|---|---|
| `click` | A click, a tap, or Enter/Space on a focused button | [2](02-from-vanilla-dom-to-react.md), [5](05-state-and-events.md) |
| `submit` | A form is submitted. Without `preventDefault()` (or a React form action), the browser loads a new page | [9](09-forms.md) |
| `input` / React's `onChange` | A field's value changes. React's `onChange` fires on every keystroke, like the DOM's `input`, not on blur like the DOM's `change` | [5](05-state-and-events.md), [9](09-forms.md) |
| `keydown` | A key is pressed. `key` is the character (`" "` for Space); `repeat` is true while held; `ctrlKey`, `metaKey`, `altKey` | [11](11-effects.md) |
| `storage` | `localStorage` changed in **another** tab of the same site | [11](11-effects.md), [13](13-custom-hooks.md) |
| `change` on a `MediaQueryList` | A media query starts or stops matching (e.g. the OS switches to dark mode) | [13](13-custom-hooks.md) |
| `cancel`, `close` on `<dialog>` | Escape pressed / the dialog closed, however it happened | [18](18-portals-and-dialogs.md) |

Event objects:

| Member | Meaning | Chapter |
|---|---|---|
| `event.target` | The element where the event started | [5](05-state-and-events.md) |
| `event.currentTarget` | The element whose listener (or React handler) is running now | [5](05-state-and-events.md) |
| `event.preventDefault()` | Skip the browser's default action (page load, scrolling on Space) | [9](09-forms.md), [11](11-effects.md) |
| `event.stopPropagation()` | Stop the event from travelling further | [5](05-state-and-events.md) |

### Propagation, delegation and React's root listener

Events go down from `window` to the target (capture), then back up (bubble). A listener on an ancestor sees
events from all its descendants: that's *event delegation*. React uses it for you: since React 17 it attaches
one listener per event type to the root element and dispatches to your `onClick` and friends from there, so
you write a handler per element without paying for a listener per element. React's synthetic events still
bubble through your component tree, and `stopPropagation()` in a handler stops them there
([Chapter 5](05-state-and-events.md)).

## JavaScript runtime refreshers

### The event loop and run-to-completion

One thread runs your code. The event loop takes one task (a script, a timer callback, an event), runs it to
completion, runs every queued microtask (promise callbacks, code after `await`), lets the browser repaint,
and repeats. Synchronous code is never interrupted, so a long loop freezes the page; async code interleaves
between `await`s, so a slow response can arrive after a newer one
([Chapter 3](03-javascript-for-react.md#the-event-loop-and-async-code), [Chapter 11](11-effects.md),
[Chapter 17](17-async-react.md)).

### Reference equality and `Object.is`

`===` compares primitives by value and objects by reference. `Object.is` is the same except that
`Object.is(NaN, NaN)` is `true` and `Object.is(0, -0)` is `false`. React compares state and props with
`Object.is`, so mutating an object in place is invisible to it: update immutably, with new objects along
the changed path ([Chapter 3](03-javascript-for-react.md#immutability-and-reference-equality),
[Chapter 5](05-state-and-events.md)).

### Closures over stale values

A function keeps the variables of the scope it was created in. A component's state values are constants of
one render, so a handler, timer or listener created during that render keeps seeing those values even after
newer renders exist. Read the latest value with an updater function, a dependency, or a ref
([Chapter 3](03-javascript-for-react.md#closures), [Chapter 5](05-state-and-events.md),
[Chapter 11](11-effects.md)).

## Browser devtools

Open them with F12 or Ctrl+Shift+I (Cmd+Option+I on a Mac). Names below are Chrome's; Firefox and Safari have
the same tools under similar names.

| Tool | Use it to | Chapter |
|---|---|---|
| Elements panel | See the live DOM, and the CSS rules on the selected element (Styles tab). Edit both live | [1](01-getting-started.md) |
| Console | Read logs, warnings and errors; run JavaScript in the page | [1](01-getting-started.md) |
| Sources panel | Set breakpoints and step through code. Source maps show your original TypeScript | [1](01-getting-started.md), [19](19-building-and-shipping.md) |
| Network panel | Every file the page loads: size, time, and the response | [1](01-getting-started.md), [19](19-building-and-shipping.md) |
| Application panel → Local storage | See, edit and delete the saved game, settings and high scores | [11](11-effects.md) |
| Device toolbar (Ctrl+Shift+M) | Try phone and tablet screen sizes | [14](14-styling.md) |
| Rendering tab → Emulate CSS media feature | Fake `prefers-color-scheme: dark` or `prefers-reduced-motion: reduce` | [12](12-refs-and-the-dom.md), [13](13-custom-hooks.md), [14](14-styling.md) |
| Elements → Accessibility pane | The accessibility tree: each element's role and accessible name | [15](15-accessibility.md) |
| Performance panel → CPU throttling | Simulate a slower device while you measure | [16](16-rendering-and-performance.md) |
| React DevTools (browser extension): Components | The component tree with props, state and hooks | [1](01-getting-started.md), [16](16-rendering-and-performance.md) |
| React DevTools: Profiler | Record renders: what rendered, why, and how long it took | [16](16-rendering-and-performance.md) |

## npm and Vite commands

| Command | What it does | Chapter |
|---|---|---|
| `npm create vite@latest five-dice -- --template react-ts` | Create a new React + TypeScript project | [1](01-getting-started.md) |
| `npm install` | Install the dependencies in `package.json`; update `package-lock.json` | [1](01-getting-started.md) |
| `npm install -D <pkg>` | Add a development dependency (tools, not app code) | [3](03-javascript-for-react.md), [8](08-testing.md) |
| `npm ci` | Clean install exactly what `package-lock.json` lists. Use it to run a `project/chNN` snapshot | [1](01-getting-started.md) |
| `npx <tool>` | Run a tool from `node_modules/.bin`, e.g. `npx vitest run` | [1](01-getting-started.md), [3](03-javascript-for-react.md) |
| `npm run <script>` | Run a script from `package.json` (`npm test` is short for `npm run test`) | [1](01-getting-started.md) |

The finished game's scripts:

| Script | Runs | What it does | Chapter |
|---|---|---|---|
| `npm run dev` | `vite` | Dev server with hot module replacement at http://localhost:5173 | [1](01-getting-started.md) |
| `npm run build` | `tsc -b && vite build` | Type-check, then build the optimized site into `dist/` | [1](01-getting-started.md), [19](19-building-and-shipping.md) |
| `npm run preview` | `vite preview` | Serve `dist/` at http://localhost:4173 to try the build | [1](01-getting-started.md), [19](19-building-and-shipping.md) |
| `npm run lint` | `oxlint` | Find bugs and bad patterns, including broken rules of hooks | [1](01-getting-started.md) |
| `npm test` | `vitest run` | Run all tests once | [8](08-testing.md) |
| `npm run test:watch` | `vitest` | Re-run tests when files change | [8](08-testing.md) |
| `npm run coverage` | `vitest run --coverage` | Tests plus a report of which lines ran | [8](08-testing.md) |
| `npm run typecheck` | `tsc -b` | Type-check only | [19](19-building-and-shipping.md) |
| `npm run check` | `npm run typecheck && npm run lint && npm test && npm run build` | What a CI server would run before shipping | [19](19-building-and-shipping.md) |

Useful flags: `vite --host` makes the dev server reachable from other devices on your network; `vitest run -u`
updates stored snapshots ([Chapter 8](08-testing.md)). Settings live in `vite.config.ts`; the `base: './'` and
`build.sourcemap` options are explained in [Chapter 19](19-building-and-shipping.md).

Sources for this chapter: [REFERENCES.md](REFERENCES.md#appendix-b--web-platform-beyond-the-basics)
