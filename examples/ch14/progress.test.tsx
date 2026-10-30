import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import ProgressDemo from './progress.demo'

it('turns the style object into an inline style attribute', () => {
  const { container } = render(<ProgressDemo />)
  fireEvent.change(screen.getByRole('slider', { name: 'Progress' }), { target: { value: '75' } })
  console.log(container.querySelector('[style]')?.outerHTML)
  console.log(screen.getByText('75%').outerHTML)
  expect(screen.getByText('75%')).toHaveStyle({ marginTop: '8px' })
})
