import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import CounterDemo from './counter.demo'
import { useCounter } from './use-counter'

it('counts in steps and resets', () => {
  // renderHook renders a tiny test component that calls the Hook.
  const { result } = renderHook(() => useCounter(5))
  expect(result.current.count).toBe(0)

  // act() applies the state update and re-renders before we look again.
  act(() => result.current.increment())
  act(() => result.current.increment())
  expect(result.current.count).toBe(10)

  act(() => result.current.reset())
  expect(result.current.count).toBe(0)
})

it('gives every component its own state', async () => {
  const user = userEvent.setup()
  render(<CounterDemo />)

  await user.click(screen.getByRole('button', { name: '+10' }))
  await user.click(screen.getByRole('button', { name: '+10' }))
  await user.click(screen.getByRole('button', { name: '+1' }))

  expect(screen.getAllByRole('paragraph').map((p) => p.textContent)).toEqual([
    'Ones: 1 +1 Reset Ones',
    'Tens: 20 +10 Reset Tens',
  ])
})
