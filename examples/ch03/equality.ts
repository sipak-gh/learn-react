// Primitives compare by value. Objects and arrays compare by reference (identity).
const word = 'ab'
console.log(word === 'a' + 'b')
const x = { value: 3 }
const y = { value: 3 }
console.log(x === y, x.value === y.value)

const a = { value: 3 }
const b = a // copies the reference, not the object
b.value = 6
console.log(a.value, a === b)

// Object.is is === except for two edge cases. React compares state with it.
const notANumber = Number('six') // NaN
const negativeZero = Math.round(-0.4) // -0
console.log(notANumber === notANumber, Object.is(notANumber, notANumber))
console.log(negativeZero === 0, Object.is(negativeZero, 0))

// Mutation: the same object, changed. A reference check can't see the change.
const dice = [{ id: 0, value: 1 }, { id: 1, value: 2 }]
const before = dice
dice[0].value = 5
console.log('mutated:   changed?', !Object.is(before, dice))

// Immutable update: a new array and a new object for what changed; the rest is shared.
const next = dice.map((d) => (d.id === 1 ? { ...d, value: 6 } : d))
console.log('immutable: changed?', !Object.is(dice, next), '| die 0 shared?', next[0] === dice[0])

// structuredClone makes a deep copy: nothing is shared.
const clone = structuredClone(dice)
console.log('clone equal?', clone[0].value === dice[0].value, '| same object?', clone[0] === dice[0])
