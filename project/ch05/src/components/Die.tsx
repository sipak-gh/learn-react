import type { DieValue } from '../game/types'

// Which cells of a 3×3 grid hold a pip for each face.
// Cells are numbered 0–8: left to right, top to bottom.
const PIP_CELLS: Record<DieValue, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

interface DieProps {
  value: DieValue
  held: boolean
  disabled: boolean
  onToggle: () => void
}

export function Die({ value, held, disabled, onToggle }: DieProps) {
  return (
    // A real <button>: clickable, focusable and keyboard-operable for free.
    // aria-label and aria-pressed tell screen readers what the pips show
    // and whether the die is held (Chapter 15 covers ARIA).
    <button
      type="button"
      className={held ? 'die die--held' : 'die'}
      disabled={disabled}
      aria-label={`Die showing ${value}`}
      aria-pressed={held}
      onClick={onToggle}
    >
      {PIP_CELLS[value].map((cell) => (
        <span
          key={cell}
          className="pip"
          style={{ gridRow: Math.floor(cell / 3) + 1, gridColumn: (cell % 3) + 1 }}
        />
      ))}
    </button>
  )
}
