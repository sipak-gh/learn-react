import { Profiler, useMemo, useState, type ProfilerOnRenderCallback } from 'react'

// Visit every possible roll of `count` dice (6^count of them) and count how
// often each total comes up. 8 dice = 1,679,616 rolls: slow on purpose.
function sumOdds(count: number): Map<number, number> {
  const totals = new Map<number, number>()
  const dice = Array<number>(count).fill(1)
  for (;;) {
    const total = dice.reduce((sum, die) => sum + die, 0)
    totals.set(total, (totals.get(total) ?? 0) + 1)
    let i = 0
    while (i < count && dice[i] === 6) dice[i++] = 1
    if (i === count) return totals
    dice[i] += 1
  }
}

function Odds({ count, cached }: { count: number; cached: boolean }) {
  const memoized = useMemo(() => (cached ? sumOdds(count) : null), [cached, count])
  const totals = memoized ?? sumOdds(count)
  const rolls = 6 ** count
  const best = [...totals].reduce((a, b) => (b[1] > a[1] ? b : a))
  return (
    <p>
      {rolls.toLocaleString('en-US')} possible rolls. The most likely total is {best[0]} (
      {((best[1] / rolls) * 100).toFixed(1)}%).
    </p>
  )
}

const logRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
  console.log(`${id} ${phase}: ${actualDuration.toFixed(1)} ms`)
}

export default function DiceOddsDemo() {
  const [count, setCount] = useState(8)
  const [name, setName] = useState('')
  const [cached, setCached] = useState(false)

  return (
    <main>
      <label>
        Dice: <input type="number" min={1} max={8} value={count} onChange={(e) => setCount(e.target.valueAsNumber || 1)} />
      </label>{' '}
      <label>
        <input type="checkbox" checked={cached} onChange={(e) => setCached(e.target.checked)} /> useMemo
      </label>
      <p>
        <label>
          Player name: <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>{' '}
        Hello, {name || 'stranger'}!
      </p>
      <Profiler id="Odds" onRender={logRender}>
        <Odds count={count} cached={cached} />
      </Profiler>
    </main>
  )
}
