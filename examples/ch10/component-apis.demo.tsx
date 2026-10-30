import type { ReactNode } from 'react'

// 1. children: the caller nests any content inside.
// 2. "Slots": more props that take JSX, for content in other places.
interface CardProps {
  title: string
  actions?: ReactNode
  children: ReactNode
}

function Card({ title, actions, children }: CardProps) {
  return (
    <section style={{ border: '1px solid #999', padding: '0.5rem', marginBottom: '1rem' }}>
      <h2>{title}</h2>
      {children}
      {actions && <footer>{actions}</footer>}
    </section>
  )
}

// 3. A render prop: a function the component calls to render each part.
// List owns the loop and the keys; the caller decides what one item looks like.
interface ListProps<T> {
  items: readonly T[]
  getKey: (item: T) => string
  renderItem: (item: T, index: number) => ReactNode
}

function List<T>({ items, getKey, renderItem }: ListProps<T>) {
  if (items.length === 0) return <p>Nobody yet.</p>
  return (
    <ol>
      {items.map((item, index) => (
        <li key={getKey(item)}>{renderItem(item, index)}</li>
      ))}
    </ol>
  )
}

interface Score {
  name: string
  total: number
}

const scores: Score[] = [
  { name: 'Ada', total: 212 },
  { name: 'Bo', total: 187 },
]

export default function ComponentApisDemo() {
  return (
    <main>
      <Card title="Standings" actions={<button type="button">Share</button>}>
        <List
          items={scores}
          getKey={(score) => score.name}
          renderItem={(score, index) => (
            <>
              {index === 0 ? '🏆 ' : ''}
              {score.name}: <strong>{score.total}</strong>
            </>
          )}
        />
      </Card>
      <Card title="Waiting room">
        <List items={[]} getKey={String} renderItem={String} />
      </Card>
    </main>
  )
}
