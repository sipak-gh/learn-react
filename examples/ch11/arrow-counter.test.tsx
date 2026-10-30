import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import ArrowCounter from './arrow-counter.demo'

it('uses the latest step without re-subscribing', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const user = userEvent.setup()
  render(<ArrowCounter />)

  await user.keyboard('{ArrowUp}')
  await user.click(screen.getByRole('button', { name: 'Step: 1' }))
  await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}')

  expect(screen.getByText('Count: 11')).toBeInTheDocument()
  expect(log.mock.calls).toEqual([['subscribe keydown']])
})
