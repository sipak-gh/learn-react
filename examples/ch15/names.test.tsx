import { logRoles, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'

// Where each element's accessible name comes from.
function Names() {
  return (
    <main>
      <button type="button">Roll</button>
      <button type="button" aria-label="Die showing 3">
        ⚂
      </button>
      <label>
        Player 1 <input defaultValue="Ada" />
      </label>
      <label htmlFor="rounds">Rounds</label>
      <input id="rounds" type="number" />
      <h2 id="standings">Standings</h2>
      <ol aria-labelledby="standings">
        <li>Ada</li>
      </ol>
      <img src="die.png" alt="A die showing six" />
      <img src="divider.png" alt="" />
      <button type="button">
        <svg aria-hidden="true" width="16" height="16" />
      </button>
    </main>
  )
}

it('names come from content, labels and ARIA', () => {
  const { container } = render(<Names />)
  logRoles(container)

  expect(screen.getByRole('button', { name: 'Die showing 3' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Player 1' })).toHaveValue('Ada')
  expect(screen.getByRole('spinbutton', { name: 'Rounds' })).toBeInTheDocument()
  expect(screen.getByRole('list')).toHaveAccessibleName('Standings')
  expect(screen.getByRole('img')).toHaveAccessibleName('A die showing six')
  // An icon-only button with no label: a button nobody can identify.
  expect(screen.getAllByRole('button')[2]).toHaveAccessibleName('')
})
