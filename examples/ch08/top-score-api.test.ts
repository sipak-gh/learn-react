import { afterEach, expect, it, vi } from 'vitest'
import { fetchTopScore } from './top-score'

afterEach(() => {
  vi.unstubAllGlobals() // put the real fetch back
})

it('reads the JSON', async () => {
  const fetchMock = vi.fn(async () => Response.json({ name: 'Ada', score: 287 }))
  vi.stubGlobal('fetch', fetchMock)

  await expect(fetchTopScore()).resolves.toEqual({ name: 'Ada', score: 287 })
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/ch08/top-score.json')
})

it('throws on an HTTP error', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('Oops', { status: 500 })))

  await expect(fetchTopScore()).rejects.toThrow('HTTP 500')
})
