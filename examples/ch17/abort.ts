import { fetchPlayer } from './fake-server.ts'

const describe = (error: unknown) => (error instanceof Error ? `${error.name}: ${error.message}` : String(error))

// 1. await waits for the promise to settle.
console.log('asking for player 1…')
console.log('got', await fetchPlayer(1, { ms: 200 }))

// 2. A failure arrives as a rejection: catch it around the await.
try {
  await fetchPlayer(-1, { ms: 100 })
} catch (error) {
  console.log('failed:', describe(error))
}

// 3. Cancel: controller.abort() makes the promise reject with an AbortError.
const controller = new AbortController()
const request = fetchPlayer(2, { ms: 1000, signal: controller.signal })
setTimeout(() => controller.abort(), 100)
try {
  await request
} catch (error) {
  console.log('cancelled:', describe(error))
}

// 4. A timeout is just a signal that aborts itself.
try {
  await fetchPlayer(3, { ms: 1000, signal: AbortSignal.timeout(50) })
} catch (error) {
  console.log('timed out:', describe(error))
}
