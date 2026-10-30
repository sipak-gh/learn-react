import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

interface Row {
  id: number
  name: string
}

// Each row has an input that React does not control: the browser keeps what you type.
function NoteList({ rows, keyBy }: { rows: Row[]; keyBy: 'id' | 'index' }) {
  return (
    <ul>
      {rows.map((row, index) => (
        <li key={keyBy === 'id' ? row.id : index}>
          <label>
            {row.name} <input />
          </label>
        </li>
      ))}
    </ul>
  )
}

const ada = { id: 1, name: 'Ada' }
const bo = { id: 2, name: 'Bo' }

describe.each(['index', 'id'] as const)('key = %s', (keyBy) => {
  it('inserting a row at the top', () => {
    const { rerender } = render(<NoteList rows={[ada]} keyBy={keyBy} />)
    // Pretend the user typed into Ada's input.
    screen.getByLabelText<HTMLInputElement>('Ada').value = 'notes for Ada'

    // Render again with Bo inserted before Ada, as a parent component would.
    rerender(<NoteList rows={[bo, ada]} keyBy={keyBy} />)

    const adaNote = screen.getByLabelText<HTMLInputElement>('Ada').value
    const boNote = screen.getByLabelText<HTMLInputElement>('Bo').value
    console.log(`key=${keyBy}: Ada's input has "${adaNote}", Bo's input has "${boNote}"`)
    if (keyBy === 'id') {
      expect(adaNote).toBe('notes for Ada')
    } else {
      expect(boNote).toBe('notes for Ada') // the text stayed in the first <li>
    }
  })
})
