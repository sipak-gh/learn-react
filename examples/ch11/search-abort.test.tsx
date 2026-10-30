import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import AbortSearchDemo from './search-abort.demo'

afterEach(() => {
  vi.unstubAllGlobals()
})

/** A fetch that answers after 100 ms, or rejects at once when its signal aborts. */
function slowFetch(_url: string, init?: RequestInit) {
  return new Promise<Response>((resolve, reject) => {
    const timer = setTimeout(() => resolve(Response.json(['Ada', 'Adele', 'Alan', 'Bo'])), 100)
    init?.signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(init.signal?.reason)
    })
  })
}

it('aborts the request for the old query', async () => {
  const fetch = vi.fn(slowFetch)
  vi.stubGlobal('fetch', fetch)
  const user = userEvent.setup()
  render(<AbortSearchDemo />)

  await user.type(screen.getByRole('textbox', { name: 'Search' }), 'd')
  await act(() => new Promise((resolve) => setTimeout(resolve, 150)))

  const signals = fetch.mock.calls.map(([, init]) => init?.signal?.aborted)
  expect(signals).toEqual([true, false]) // "a" was cancelled, "ad" was not
  expect(screen.getByRole('paragraph')).toHaveTextContent('Ada, Adele')
})
