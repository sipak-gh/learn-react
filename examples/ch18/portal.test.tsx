import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import PortalDemo from './portal.demo'

it('puts the DOM elsewhere, but keeps the React tree', async () => {
  const user = userEvent.setup()
  const { container } = render(<PortalDemo />)
  const toast = screen.getByRole('status')

  // In the DOM, the toast is a child of <body>, outside the app's container.
  expect(toast.parentElement).toBe(document.body)
  expect(container).not.toContainElement(toast)

  // In the React tree it is still inside <main> and the context provider.
  expect(toast).toHaveTextContent('Saved, Ada!')
  await user.click(screen.getByRole('button', { name: 'OK' }))
  expect(screen.getByText('Clicks seen by <main>: 1')).toBeInTheDocument()
})

it('renders in place without the portal', async () => {
  const user = userEvent.setup()
  const { container } = render(<PortalDemo />)
  await user.click(screen.getByRole('checkbox'))

  expect(container).toContainElement(screen.getByRole('status'))
})
