import { act, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import MediaQueryDemo from './media-query.demo'

// jsdom has no matchMedia, so we install a fake one that the test controls.
function fakeMatchMedia() {
  const matches = new Map<string, boolean>()
  const listeners = new Map<string, Set<() => void>>()
  const listenersFor = (query: string) => listeners.get(query) ?? listeners.set(query, new Set()).get(query)!

  window.matchMedia = (query: string) =>
    ({
      media: query,
      matches: matches.get(query) ?? false,
      addEventListener: (_type: string, listener: () => void) => listenersFor(query).add(listener),
      removeEventListener: (_type: string, listener: () => void) => listenersFor(query).delete(listener),
    }) as unknown as MediaQueryList

  // Change a query's result and fire 'change', like the browser does.
  return (query: string, value: boolean) => {
    matches.set(query, value)
    for (const listener of listenersFor(query)) listener()
  }
}

it('re-renders when a media query starts or stops matching', () => {
  const setMatch = fakeMatchMedia()
  render(<MediaQueryDemo />)
  expect(screen.getByText(/^Window:/)).toHaveTextContent('Window: narrow')

  // The store changed outside React: React re-reads the snapshot and re-renders.
  act(() => setMatch('(min-width: 40rem)', true))
  expect(screen.getByText(/^Window:/)).toHaveTextContent('Window: wide (40rem or more)')

  act(() => setMatch('(prefers-color-scheme: dark)', true))
  expect(screen.getByText(/^Color scheme:/)).toHaveTextContent('Color scheme: dark')
})
