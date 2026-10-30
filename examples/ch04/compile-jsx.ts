// Compile JSX the way Vite does and print the JavaScript it turns into.
// Usage: node ch04/compile-jsx.ts            (compiles the sample below)
//        node ch04/compile-jsx.ts '<p>Hi</p>' (compiles your own snippet)
import { transformWithOxc } from 'vite'

const sample = `
export function Greeting({ name }: { name: string }) {
  return (
    <section className="greeting">
      <h2>Hello, {name}!</h2>
      <p>Welcome to Five Dice.</p>
    </section>
  )
}
const items = [1, 2].map((n) => <li key={n}>{n}</li>)
`

const source = process.argv[2] ?? sample
const result = await transformWithOxc(source, 'example.tsx', {
  // The settings Vite uses for a production build.
  jsx: { runtime: 'automatic', development: false },
})
console.log(result.code)
