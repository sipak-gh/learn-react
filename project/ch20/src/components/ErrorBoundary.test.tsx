import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

it('shows the fallback after an error, reports it, and can reset', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  let broken = true
  function Fragile() {
    if (broken) throw new Error('Boom')
    return <p>All good</p>
  }
  const onError = vi.fn()
  const user = userEvent.setup()

  render(
    <ErrorBoundary
      onError={onError}
      onReset={() => (broken = false)}
      fallback={(error, reset) => (
        <button type="button" onClick={reset}>
          {error instanceof Error ? error.message : 'Error'}: reset
        </button>
      )}
    >
      <Fragile />
    </ErrorBoundary>,
  )

  expect(onError).toHaveBeenCalledWith(new Error('Boom'), expect.objectContaining({ componentStack: expect.any(String) }))
  await user.click(screen.getByRole('button', { name: 'Boom: reset' }))
  expect(screen.getByText('All good')).toBeInTheDocument()
  vi.mocked(console.error).mockRestore()
})
