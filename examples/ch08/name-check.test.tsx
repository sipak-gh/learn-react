import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import NameCheck from './name-check.demo'

describe('NameCheck', () => {
  it('asks the server and shows the answer', async () => {
    const user = userEvent.setup()
    const checkName = vi.fn(async () => true)
    render(<NameCheck checkName={checkName} />)

    await user.type(screen.getByLabelText('User name'), 'Cy')
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(await screen.findByText('Cy is available.')).toBeInTheDocument()
    expect(checkName).toHaveBeenCalledExactlyOnceWith('Cy')
  })

  it('shows "Checking…" while it waits', async () => {
    const user = userEvent.setup()
    // A promise that we resolve by hand, so the test controls the timing.
    let answer = (_free: boolean) => {}
    const checkName = () =>
      new Promise<boolean>((resolve) => {
        answer = resolve
      })
    render(<NameCheck checkName={checkName} />)

    await user.type(screen.getByLabelText('User name'), 'Ada')
    await user.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Checking…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled()

    answer(false)
    expect(await screen.findByText('Ada is taken.')).toBeInTheDocument()
    expect(screen.queryByText('Checking…')).not.toBeInTheDocument()
  })

  it('works with the slow default server too', async () => {
    const user = userEvent.setup()
    render(<NameCheck />)

    await user.type(screen.getByLabelText('User name'), 'Bo')
    await user.click(screen.getByRole('button', { name: 'Check' }))

    // findBy* and waitFor retry for up to 1000 ms. The fake server needs 500 ms.
    await waitFor(() => {
      expect(screen.getByText('Bo is taken.')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Check' })).toBeEnabled()
  })
})
