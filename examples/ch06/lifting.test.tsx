import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Rules } from './lifting.demo'

it('shows one section at a time', () => {
  render(<Rules />)
  expect(screen.getByText(/Add up one face/)).toBeInTheDocument()
  expect(screen.queryByText(/Score patterns/)).not.toBeInTheDocument()

  // Only the closed section has a Show button.
  fireEvent.click(screen.getByRole('button', { name: 'Show' }))

  expect(screen.queryByText(/Add up one face/)).not.toBeInTheDocument()
  expect(screen.getByText(/Score patterns/)).toBeInTheDocument()
})
