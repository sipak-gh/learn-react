import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import NativeValidation from './native-validation.demo'

function section(name: string) {
  return within(screen.getByRole('heading', { name }).closest('section')!)
}

it('runs the action only when the browser accepts the fields', async () => {
  const user = userEvent.setup()
  render(<NativeValidation />)
  const form = section('Browser checks')
  const email = form.getByLabelText('Email')

  await user.click(form.getByRole('button', { name: 'Join' }))
  await user.type(email, 'ada{Enter}')
  expect(email).toBeInvalid()
  expect(form.getByText('Joined: nobody yet')).toBeInTheDocument()

  await user.type(email, '@example.com{Enter}')
  expect(await form.findByText('Joined: "ada@example.com"')).toBeInTheDocument()
  expect(email).toHaveValue('')
})

it('runs the action anyway with noValidate', async () => {
  const user = userEvent.setup()
  render(<NativeValidation />)
  const form = section('noValidate')

  await user.click(form.getByRole('button', { name: 'Join' }))
  expect(await form.findByText('Joined: ""')).toBeInTheDocument()
})
