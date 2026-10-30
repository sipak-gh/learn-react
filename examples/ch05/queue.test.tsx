import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

function Score() {
  const [score, setScore] = useState(0)

  return (
    <>
      <p>Score: {score}</p>
      <button
        type="button"
        onClick={() => {
          setScore(score + 1)
          setScore(score + 1)
          setScore(score + 1)
        }}
      >
        three values
      </button>
      <button
        type="button"
        onClick={() => {
          setScore((s) => s + 1)
          setScore((s) => s + 1)
          setScore((s) => s + 1)
        }}
      >
        three updaters
      </button>
      <button
        type="button"
        onClick={() => {
          setScore(score + 5)
          setScore((s) => s + 1)
        }}
      >
        value, then updater
      </button>
    </>
  )
}

describe('one click from 0', () => {
  it.each([
    ['three values', 'Score: 1'],
    ['three updaters', 'Score: 3'],
    ['value, then updater', 'Score: 6'],
  ])('%s gives %s', (name, expected) => {
    render(<Score />)
    fireEvent.click(screen.getByRole('button', { name }))
    expect(screen.getByRole('paragraph')).toHaveTextContent(expected)
  })
})
