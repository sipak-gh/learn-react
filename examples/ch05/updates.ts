// Immutable updates: build a new value instead of changing the old one.
interface Die {
  id: number
  value: number
  held: boolean
}

const dice: readonly Die[] = [
  { id: 0, value: 2, held: false },
  { id: 1, value: 5, held: true },
  { id: 2, value: 5, held: false },
]

// Add: spread the old items into a new array.
const added = [...dice, { id: 3, value: 1, held: false }]
// Remove: filter.
const removed = dice.filter((die) => die.id !== 1)
// Change one item: map, and copy the item you change.
const toggled = dice.map((die) => (die.id === 2 ? { ...die, held: !die.held } : die))
// Sort, reverse, splice: use the copying versions.
const sorted = dice.toSorted((a, b) => a.value - b.value)

console.log('added:  ', added.map((die) => die.id))
console.log('removed:', removed.map((die) => die.id))
console.log('toggled:', toggled.map((die) => die.held))
console.log('sorted: ', sorted.map((die) => die.value))
console.log('original unchanged:', dice.map((die) => `${die.id}:${die.value}:${die.held}`))

// Untouched items are shared, not copied (a shallow copy).
console.log('toggled[0] === dice[0]:', toggled[0] === dice[0])
console.log('toggled[2] === dice[2]:', toggled[2] === dice[2])

// Nested objects: copy every level on the path to the change.
const game = { round: 2, player: { name: 'Ada', score: 10 } }
const next = { ...game, player: { ...game.player, score: game.player.score + 5 } }
console.log(next, 'old score:', game.player.score)

// React compares old and new state with Object.is: identity, not contents.
console.log(Object.is(game, game), Object.is(game, { ...game }))
