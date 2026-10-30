import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'

// Every file named *.demo.tsx under chNN/ is a demo. Its default export is a component.
const demos = import.meta.glob<{ default: ComponentType }>('./ch*/**/*.demo.tsx', { eager: true })

// "./ch05/counter.demo.tsx" -> "ch05/counter"
const demoName = (path: string) => path.slice(2).replace(/\.demo\.tsx$/, '')

const wanted = new URLSearchParams(location.search).get('demo')
const entry = Object.entries(demos).find(([path]) => demoName(path) === wanted)

// The demo picker is only used here, so fast refresh does not matter for it.
// oxlint-disable-next-line react/only-export-components
function DemoList() {
  return (
    <main>
      <h1>Learn React examples</h1>
      <ul>
        {Object.keys(demos).map((path) => (
          <li key={path}>
            <a href={`?demo=${demoName(path)}`}>{demoName(path)}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}

const Demo = entry ? entry[1].default : DemoList

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
