// A toy model of how React stores Hooks: each call gets the next slot in a list.
// This is not React's code, but it is the same idea.

const slots: unknown[] = []
let next = 0 // the slot the next call will use

// Our stand-in for useState. (Named toyState, not useState, so it's clearly a toy.)
function toyState<T>(initial: T): T {
  const slot = next++
  if (!(slot in slots)) slots[slot] = initial // first render: fill the slot
  return slots[slot] as T
}

function Profile(showAge: boolean): string {
  const name = toyState('Ada')
  // 🔴 A Hook call inside a condition: this breaks the call order.
  const age = showAge ? toyState(36) : '(hidden)'
  const city = toyState('London')
  return `name=${name} age=${age} city=${city}`
}

function render(showAge: boolean) {
  next = 0 // every render starts again at slot 0
  console.log(`showAge=${showAge}:`.padEnd(16), Profile(showAge).padEnd(36), JSON.stringify(slots))
}

render(true)
render(true)
render(false) // `city` now reads slot 1, which holds the age
