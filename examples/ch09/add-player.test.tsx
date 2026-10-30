import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import AddPlayer from './add-player.demo'

it.each(['onSubmit', 'action'])('adds a player and clears the input (%s)', async (name) => {
  const user = userEvent.setup()
  render(<AddPlayer />)
  const section = within(screen.getByRole('heading', { name }).closest('section')!)

  await user.type(section.getByLabelText('Name'), 'Ada{Enter}')

  expect(await section.findByRole('listitem')).toHaveTextContent('Ada')
  expect(section.getByLabelText('Name')).toHaveValue('')
})
