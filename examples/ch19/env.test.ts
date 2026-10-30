import { describe, expect, it } from 'vitest'

describe('import.meta.env in Vitest', () => {
  it('runs in "test" mode', () => {
    expect(import.meta.env.MODE).toBe('test')
  })

  it('counts as development, not production', () => {
    expect(import.meta.env.DEV).toBe(true)
    expect(import.meta.env.PROD).toBe(false)
  })
})
