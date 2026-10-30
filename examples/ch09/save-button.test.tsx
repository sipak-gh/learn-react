import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import SaveButton from './save-button.demo'

it('queues the calls and runs them one after another', async () => {
  const user = userEvent.setup()
  render(<SaveButton delay={10} />)
  const button = screen.getByRole('button', { name: 'Save 10 points' })

  await user.click(button)
  await user.click(button)
  await user.click(button)
  expect(screen.getByText('Saving…')).toBeInTheDocument()

  expect(await screen.findByText('Saved: 30 points')).toBeInTheDocument()
  expect(screen.queryByText('Saving…')).not.toBeInTheDocument()
})
