import { useEffect, useRef, useState } from 'react'

// Stands in for a non-React library: it builds and owns DOM inside `container`.
function createBarChart(container: HTMLElement) {
  const bars = document.createElement('div')
  bars.className = 'bars'
  bars.style.cssText = 'display: flex; align-items: end; gap: 4px; height: 60px'
  container.append(bars)
  return {
    update(values: number[]) {
      bars.replaceChildren(
        ...values.map((value) => {
          const bar = document.createElement('div')
          bar.style.cssText = `width: 16px; height: ${value * 10}px; background: steelblue`
          bar.title = String(value)
          return bar
        }),
      )
    },
    destroy() {
      bars.remove()
    },
  }
}

type BarChart = ReturnType<typeof createBarChart>

function DiceChart({ values }: { values: number[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<BarChart | null>(null)

  // Create the widget when the container appears, destroy it when it goes.
  useEffect(() => {
    if (!containerRef.current) return
    const chart = createBarChart(containerRef.current)
    chartRef.current = chart
    return () => {
      chart.destroy()
      chartRef.current = null
    }
  }, [])

  // Hand it new data whenever the props change.
  useEffect(() => {
    chartRef.current?.update(values)
  }, [values])

  // React renders the container empty and never touches what's inside.
  return <div ref={containerRef} className="chart" />
}

const rollDie = () => Math.floor(Math.random() * 6) + 1

export default function WidgetDemo() {
  const [values, setValues] = useState(() => Array.from({ length: 5 }, rollDie))
  const [shown, setShown] = useState(true)

  return (
    <main>
      <button type="button" onClick={() => setValues(values.map(rollDie))}>
        Roll
      </button>{' '}
      <button type="button" onClick={() => setShown(!shown)}>
        {shown ? 'Hide' : 'Show'} chart
      </button>
      {shown && <DiceChart values={values} />}
    </main>
  )
}
