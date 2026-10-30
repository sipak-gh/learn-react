import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import LiveRegionDemo from './live-region.demo'

it('puts the result in the status region', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5) // 0.5 * 6 = 3, + 1 = 4
  const user = userEvent.setup()
  render(<LiveRegionDemo />)

  const status = screen.getByRole('status')
  expect(status).toBeEmptyDOMElement()

  await user.click(screen.getByRole('button', { name: 'Roll' }))
  expect(status).toHaveTextContent('You rolled 4.')
  // Focus stays on the button: the user can roll again straight away.
  expect(screen.getByRole('button', { name: 'Roll' })).toHaveFocus()
})

it('changes nothing when the same number comes up twice', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  const user = userEvent.setup()
  render(<LiveRegionDemo />)
  const status = screen.getByRole('status')

  // Screen readers react to changes in the region's DOM. Record them.
  const changes: MutationRecord[] = []
  new MutationObserver((records) => changes.push(...records)).observe(status, {
    childList: true,
    characterData: true,
    subtree: true,
  })

  await user.click(screen.getByRole('button', { name: 'Roll' }))
  const afterFirstRoll = changes.length
  expect(afterFirstRoll).toBeGreaterThan(0)

  await user.click(screen.getByRole('button', { name: 'Roll' }))
  // The same string: React had nothing to change in the DOM.
  expect(changes).toHaveLength(afterFirstRoll)
})
