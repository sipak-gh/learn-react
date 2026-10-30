# Five Dice

A dice game for 1–4 players on one screen, built with React, TypeScript and Vite.

Each turn you roll five dice up to three times, holding the ones you want to keep,
and then score the roll in one of 13 categories on your scorecard. After 13 turns,
the highest total wins.

## Playing

- **Roll** the dice. Click a die (or press its number, 1–5) to hold it, and roll again.
  Press <kbd>Space</kbd> to roll.
- After your last roll (or sooner), pick a category on the scorecard. Each category
  can be used once; a roll that doesn't fit a category scores 0 there.
- The game saves itself in the browser: reload the page and carry on.
- Click **Rules** for the full scoring table.

Scoring, as implemented:

| Category | Scores |
| --- | --- |
| Ones … Sixes | the total of the dice showing that number; 63 or more in this section earns a 35-point bonus |
| Three / Four of a Kind | the sum of all dice |
| Full House (three of one number and two of another) | 25 |
| Small Straight (four in a row) | 30 |
| Large Straight (five in a row) | 40 |
| Five of a Kind | 50 |
| Chance | the sum of all dice |

Five of a Kind does not count as a Full House. Each extra Five of a Kind, after
scoring 50 in that category, earns a 100-point bonus (you can turn this off when
starting a game). Rules: [Five Dice at beesboardsma.com](https://beesboardsma.com/pages/five-dice).

## Running it

You need Node.js 22.22.2+, 24.15+ or 26+ (the oldest versions that all the tools support).

```sh
npm ci          # install the exact versions from package-lock.json
npm run dev     # start the development server at http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | development server with instant updates |
| `npm test` | run the tests once (`npm run test:watch` to keep watching) |
| `npm run coverage` | tests with a code coverage report in `coverage/` |
| `npm run typecheck` | type-check with TypeScript |
| `npm run lint` | check the code with Oxlint |
| `npm run build` | type-check, then build the production app into `dist/` |
| `npm run preview` | serve `dist/` locally to try the production build |
| `npm run check` | everything above, in order: run it before you publish |

## Configuration

Settings live in `.env`; put your own values in `.env.local` (not committed).

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_LEADERBOARD_LATENCY` | `600` | average delay of the pretend leaderboard server, in milliseconds |

The leaderboard is a fake server that stores scores in your browser's localStorage.
In development, add `?failure=0.5` to the URL to make half of its requests fail.

## Publishing

`npm run build` writes a static website to `dist/`. Copy the contents of that folder
to any web server or static host; it works from any folder, such as
`https://example.com/games/five-dice/`.

## Project structure

```
src/
  game/        the rules: pure TypeScript, no React (dice, scoring, reducer, storage)
  components/  React components, each with its CSS Module and tests
  hooks/       custom hooks (keyboard shortcuts, localStorage, theme, …)
  services/    the fake leaderboard server
  styles/      shared CSS Modules (buttons, tables)
  test/        test setup
  index.css    global styles and theme colours
  main.tsx     entry point
```

Built with React 19 and the React Compiler, Vite, TypeScript, Vitest and Testing Library.
