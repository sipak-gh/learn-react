import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
// Adds DOM matchers such as toBeInTheDocument() and toBeDisabled() to expect().
import '@testing-library/jest-dom/vitest'

// Unmount whatever a test rendered, so the next test starts with an empty page.
// (Testing Library does this by itself only when Vitest's `globals` option is on.)
afterEach(() => {
  cleanup()
})
