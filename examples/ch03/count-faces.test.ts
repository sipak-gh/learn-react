import { describe, expect, it } from 'vitest'
import { countFaces } from './count-faces.ts'

describe('countFaces', () => {
  it('counts each face', () => {
    expect(countFaces([3, 6, 3, 1, 3])).toEqual([1, 0, 3, 0, 0, 1])
  })

  it('gives all zeros for no dice', () => {
    expect(countFaces([])).toEqual([0, 0, 0, 0, 0, 0])
  })

  it('does not change its input', () => {
    const values = [5, 5, 2]
    countFaces(values)
    expect(values).toEqual([5, 5, 2])
  })
})
