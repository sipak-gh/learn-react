import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
// Adds DOM matchers such as toBeInTheDocument() and toBeDisabled() to expect().
import '@testing-library/jest-dom/vitest'

// Unmount whatever a test rendered, so the next test starts with an empty page.
// (Testing Library does this by itself only when Vitest's `globals` option is on.)
afterEach(() => {
  cleanup()
  // Saved games must not leak from one test into the next.
  localStorage.clear()
})

// jsdom implements much of the DOM, but not everything. Stub what the app uses:
// the Web Animations API, matchMedia (media queries from JavaScript) and
// <dialog>'s showModal() and close(), which also returns focus to where it was.
const focusBeforeDialog = new WeakMap<HTMLDialogElement, Element | null>()
HTMLDialogElement.prototype.showModal = function () {
  this.open = true
  focusBeforeDialog.set(this, document.activeElement)
}
HTMLDialogElement.prototype.close = function () {
  this.open = false
  const previous = focusBeforeDialog.get(this)
  if (previous instanceof HTMLElement) previous.focus()
  this.dispatchEvent(new Event('close'))
}
Element.prototype.animate = vi.fn()
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList
