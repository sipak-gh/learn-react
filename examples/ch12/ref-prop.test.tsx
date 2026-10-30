import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import RefPropDemo from './ref-prop.demo'

it('passes a ref through a component like any other prop', async () => {
  const user = userEvent.setup()
  render(<RefPropDemo />)
  await user.click(screen.getByRole('button', { name: 'Focus name' }))
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()
})

it('exposes only focus() and clear() through useImperativeHandle', async () => {
  const user = userEvent.setup()
  render(<RefPropDemo />)
  const search = screen.getByRole('textbox', { name: 'Search' })
  expect(search).toHaveValue('dice')
  await user.click(screen.getByRole('button', { name: 'New search' }))
  expect(search).toHaveValue('')
  expect(search).toHaveFocus()
})
