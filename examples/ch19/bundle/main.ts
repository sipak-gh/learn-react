import { add } from './math.ts'

if (import.meta.env.DEV) {
  console.log('debugging aid: only in development')
}

console.log('2 + 3 =', add(2, 3))

async function showAverage(values: number[]) {
  // A dynamic import: the bundler puts stats.ts in a file of its own,
  // which is downloaded when this line runs.
  const { average } = await import('./stats.ts')
  console.log('average:', average(values))
}

await showAverage([2, 4, 6])
