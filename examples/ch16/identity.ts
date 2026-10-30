// React compares props, state and dependencies with Object.is: "the same value?"
console.log(Object.is(3, 3)) // numbers, strings, booleans: compared by value
console.log(Object.is('Ada', 'Ada'))
console.log(Object.is([3, 4], [3, 4])) // two arrays: two different objects
console.log(Object.is({ held: true }, { held: true }))

// A component body runs again on every render, so it makes new objects each time.
function render() {
  const dice = [3, 4, 5]
  const onRoll = () => console.log('roll')
  return { dice, onRoll }
}
const first = render()
const second = render()
console.log(Object.is(first.dice, second.dice), Object.is(first.onRoll, second.onRoll))

// Keep a reference and it stays the same.
const kept = first.dice
console.log(Object.is(kept, first.dice))
