import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Die } from './Die'

// A snapshot records the rendered HTML and fails if it ever changes.
// Handy for small, stable output; a poor fit for anything that changes often.
it('renders a three as three pips on the diagonal', () => {
  const { container } = render(<Die value={3} held={false} disabled={false} onToggle={() => {}} />)
  expect(container.innerHTML).toMatchInlineSnapshot(`"<button type="button" class="die" aria-label="Die showing 3" aria-pressed="false"><span class="pip" style="grid-row: 1; grid-column: 1;"></span><span class="pip" style="grid-row: 2; grid-column: 2;"></span><span class="pip" style="grid-row: 3; grid-column: 3;"></span></button>"`)
})
