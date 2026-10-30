/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vitest reads its settings from the same file: https://vitest.dev/config/
  test: {
    // Simulate a browser (document, window, …) in Node for component tests.
    environment: 'jsdom',
    // Runs before every test file: adds the jest-dom matchers.
    setupFiles: ['./src/test/setup.ts'],
  },
})
