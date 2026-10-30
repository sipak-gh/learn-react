/// <reference types="vitest/config" />
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // React Compiler: memoizes components and hooks automatically at build time.
    // It runs as a Babel preset; Vite itself transforms code with Oxc.
    babel({ presets: [reactCompilerPreset()] }),
  ],
  // Relative URLs for scripts and styles, so the built app works from any
  // folder on any static web server (e.g. https://example.com/games/five-dice/).
  base: './',
  build: {
    // Also write source maps (.map files): browser devtools then show the
    // original source code in errors and the debugger.
    sourcemap: true,
  },
  // Vitest reads its settings from the same file: https://vitest.dev/config/
  test: {
    // Simulate a browser (document, window, …) in Node for component tests.
    environment: 'jsdom',
    // Runs before every test file: adds the jest-dom matchers.
    setupFiles: ['./src/test/setup.ts'],
  },
})
