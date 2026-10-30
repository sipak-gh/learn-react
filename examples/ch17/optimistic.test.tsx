import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import OptimisticDemo from './optimistic.demo'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

async function send(text: string) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), { target: { value: text } })
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Send' })))
}
const items = () => screen.queryAllByRole('listitem').map((item) => item.textContent)

it('shows the message at once, then the saved version', async () => {
  render(<OptimisticDemo />)
  await send('Hi')
  expect(items()).toEqual(['Hi (sending…)'])

  await act(async () => vi.advanceTimersByTime(1000))
  expect(items()).toEqual(['Hi'])
})

it('takes the optimistic message back when saving fails', async () => {
  render(<OptimisticDemo />)
  await send('Hi!')
  expect(items()).toEqual(['Hi! (sending…)'])

  await act(async () => vi.advanceTimersByTime(1000))
  expect(items()).toEqual([])
  expect(screen.getByRole('alert')).toHaveTextContent('Not sent: No shouting.')
})
