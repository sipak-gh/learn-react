import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import KeyListener from './key-listener.demo'

it('keeps the leaky listeners after unmount', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const user = userEvent.setup()
  render(<KeyListener />)
  const toggle = screen.getByRole('button')

  await user.keyboard('a')
  expect(log.mock.calls).toEqual([['leaky saw a'], ['tidy saw a']])

  log.mockClear()
  await user.click(toggle) // hide
  await user.keyboard('b')
  expect(log.mock.calls).toEqual([['leaky saw b']])

  log.mockClear()
  await user.click(toggle) // show again
  await user.keyboard('c')
  expect(log.mock.calls).toEqual([['leaky saw c'], ['leaky saw c'], ['tidy saw c']])
})
