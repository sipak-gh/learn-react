import { useState, type ReactNode } from 'react'

// Before: each section owns its state, so they can't coordinate.
function SelfSection({ title, children }: { title: string; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section>
      <h3>{title}</h3>
      {isOpen ? (
        <p>{children}</p>
      ) : (
        <button type="button" onClick={() => setIsOpen(true)}>
          Show
        </button>
      )}
    </section>
  )
}

// After: the parent owns the state. The section is controlled by its props.
interface SectionProps {
  title: string
  isOpen: boolean
  onShow: () => void
  children: ReactNode
}

export function Section({ title, isOpen, onShow, children }: SectionProps) {
  return (
    <section>
      <h3>{title}</h3>
      {isOpen ? (
        <p>{children}</p>
      ) : (
        <button type="button" onClick={onShow}>
          Show
        </button>
      )}
    </section>
  )
}

export function Rules() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <>
      <Section title="Upper section" isOpen={openIndex === 0} onShow={() => setOpenIndex(0)}>
        Add up one face. 63 or more earns a bonus.
      </Section>
      <Section title="Lower section" isOpen={openIndex === 1} onShow={() => setOpenIndex(1)}>
        Score patterns: kinds, a full house, straights.
      </Section>
    </>
  )
}

export default function LiftingDemo() {
  return (
    <>
      <h1>Lifting state up</h1>
      <h2>Each section owns its state</h2>
      <SelfSection title="Upper section">Add up one face. 63 or more earns a bonus.</SelfSection>
      <SelfSection title="Lower section">Score patterns: kinds, a full house, straights.</SelfSection>
      <h2>The parent owns the state</h2>
      <Rules />
    </>
  )
}
