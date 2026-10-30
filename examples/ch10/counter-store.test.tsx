import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useContext } from 'react'
import { expect, it } from 'vitest'
import { CountContext, CountDispatchContext } from './counter-contexts'
import CounterStoreDemo, { CounterProvider, Display } from './counter-store.demo'

it('shares the state and the dispatch function through context', async () => {
  const user = userEvent.setup()
  render(<CounterStoreDemo />)
  await user.click(screen.getByRole('button', { name: '+1' }))
  await user.click(screen.getByRole('button', { name: '+1' }))
  expect(screen.getByText('Count: 2')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  expect(screen.getByText('Count: 0')).toBeInTheDocument()
})

it('re-renders only the components that read the changed context', async () => {
  const renders: string[] = []
  function CountReader() {
    renders.push('CountReader')
    return <p>{useContext(CountContext)}</p>
  }
  function DispatchReader() {
    renders.push('DispatchReader')
    const dispatch = useContext(CountDispatchContext)
    return (
      <button type="button" onClick={() => dispatch?.({ type: 'add', amount: 1 })}>
        Add
      </button>
    )
  }

  const user = userEvent.setup()
  render(
    <CounterProvider>
      <CountReader />
      <DispatchReader />
    </CounterProvider>,
  )
  expect(renders).toEqual(['CountReader', 'DispatchReader'])

  renders.length = 0
  await user.click(screen.getByRole('button', { name: 'Add' }))
  // dispatch never changes, so DispatchReader is skipped.
  expect(renders).toEqual(['CountReader'])
})

it('fails loudly without a provider', () => {
  expect(() => render(<Display />)).toThrow('Display must be used inside <CounterProvider>')
})
