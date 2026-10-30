import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Signup from './signup.demo'

describe('Signup', () => {
  it('sends the form values to the server', async () => {
    const user = userEvent.setup()
    const register = vi.fn(async () => null)
    render(<Signup register={register} />)

    await user.type(screen.getByLabelText('Email'), 'cy@example.com')
    await user.selectOptions(screen.getByLabelText('Plan'), 'pro')
    await user.click(screen.getByRole('checkbox', { name: 'Send me the newsletter' }))
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(await screen.findByText('Welcome! We sent a link to cy@example.com.')).toBeInTheDocument()
    expect(register).toHaveBeenCalledExactlyOnceWith({ email: 'cy@example.com', plan: 'pro', newsletter: false })
  })

  it('checks the email before it calls the server', async () => {
    const user = userEvent.setup()
    const register = vi.fn(async () => null)
    render(<Signup register={register} />)

    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter an email address.')
    expect(screen.getByLabelText('Email')).toBeInvalid()
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter an email address.')
    expect(register).not.toHaveBeenCalled()
  })

  it('shows the server error and keeps what was typed', async () => {
    const user = userEvent.setup()
    render(<Signup register={async () => 'That email is already registered.'} />)

    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.selectOptions(screen.getByLabelText('Plan'), 'pro')
    await user.click(screen.getByRole('checkbox', { name: 'Send me the newsletter' }))
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('That email is already registered.')
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com')
    expect(screen.getByLabelText('Plan')).toHaveValue('pro')
    expect(screen.getByRole('checkbox', { name: 'Send me the newsletter' })).not.toBeChecked()
  })

  it('disables the button while the server works', async () => {
    const user = userEvent.setup()
    let answer = (_error: string | null) => {}
    const register = () =>
      new Promise<string | null>((resolve) => {
        answer = resolve
      })
    render(<Signup register={register} />)

    await user.type(screen.getByLabelText('Email'), 'cy@example.com')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(await screen.findByRole('button', { name: 'Signing up…' })).toBeDisabled()

    answer(null)
    expect(await screen.findByText(/Welcome!/)).toBeInTheDocument()
  })
})
