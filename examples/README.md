# Examples

The small, standalone examples from the chapters. The game itself lives in [`../project`](../project).

This folder is one shared sandbox app (Vite, React, TypeScript, Vitest), so you install packages once:

```console
$ cd examples
$ npm install
```

Each chapter's examples are in `chNN/`. There are three kinds of file:

| File | What it is | How to run it |
|---|---|---|
| `chNN/<name>.demo.tsx` | A React demo; its default export is a component | `npm run dev`, open the printed URL and pick the demo from the list, or go straight to `http://localhost:5173/?demo=chNN/<name>` |
| `chNN/<name>.test.ts(x)` | Tests for an example | `npm test` (all) or `npx vitest run chNN` (one chapter) |
| `chNN/<name>.ts` | Plain TypeScript with no browser or React | `node chNN/<name>.ts` (Node runs TypeScript directly) |
| `chNN/<name>/index.html` | A plain web page with no React | `npm run dev`, then open `http://localhost:5173/chNN/<name>/` |

`npm run typecheck` checks every example.
