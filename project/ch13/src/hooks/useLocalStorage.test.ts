import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  it('starts with the initial value and persists updates', () => {
    // renderHook renders a tiny test component that calls the hook.
    const { result } = renderHook(() => useLocalStorage('count', 0))
    expect(result.current[0]).toBe(0)

    // act() applies the state update and re-renders before we look.
    act(() => result.current[1](5))
    expect(result.current[0]).toBe(5)
    expect(localStorage.getItem('count')).toBe('5')
  })

  it('keeps every user of the same key in sync', () => {
    const first = renderHook(() => useLocalStorage('name', 'Ada'))
    const second = renderHook(() => useLocalStorage('name', 'Ada'))
    act(() => first.result.current[1]('Bo'))
    expect(second.result.current[0]).toBe('Bo')
  })

  it('falls back to the initial value when stored data is corrupt', () => {
    localStorage.setItem('broken', '{oops')
    const { result } = renderHook(() => useLocalStorage('broken', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })
})
