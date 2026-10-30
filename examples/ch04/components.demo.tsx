import type { ReactNode } from 'react'

interface BadgeProps {
  label: string
  count?: number // optional prop
  tone?: 'info' | 'warning'
}

// Default values come from destructuring defaults.
function Badge({ label, count = 0, tone = 'info' }: BadgeProps) {
  const color = tone === 'warning' ? 'darkred' : 'navy'
  return (
    <span style={{ color, marginRight: 12 }}>
      {label}: {count}
    </span>
  )
}

interface CardProps {
  title: string
  children: ReactNode // whatever is nested between <Card> and </Card>
  footer?: ReactNode // JSX can be passed in any prop, not only children
}

function Card({ title, children, footer }: CardProps) {
  return (
    <section style={{ border: '1px solid gray', padding: 8, margin: 8 }}>
      <h2>{title}</h2>
      {children}
      {footer}
    </section>
  )
}

// Specialisation by composition: a WarningCard is a Card with some parts filled in.
function WarningCard({ children }: { children: ReactNode }) {
  return (
    <Card title="Warning" footer={<Badge label="Severity" count={2} tone="warning" />}>
      {children}
    </Card>
  )
}

export default function Components() {
  return (
    <>
      <Card title="Players">
        <Badge label="Ada" count={3} />
        <Badge label="Bo" />
      </Card>
      <WarningCard>
        <p>Your turn is about to end.</p>
      </WarningCard>
    </>
  )
}
