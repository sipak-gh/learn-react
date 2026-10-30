// A closure: a function plus the variables it captured from where it was created.
function makeCounter() {
  let count = 0 // private: only the returned functions can reach it
  return {
    increment: () => ++count,
    current: () => count,
  }
}
const c1 = makeCounter()
const c2 = makeCounter()
c1.increment()
c1.increment()
c2.increment()
console.log(c1.current(), c2.current()) // each call to makeCounter has its own `count`

// let in a loop: each iteration gets a fresh binding, so each callback sees its own i.
const callbacks: (() => number)[] = []
for (let i = 0; i < 3; i++) callbacks.push(() => i)
console.log(callbacks.map((f) => f()))

// A closure captures a variable, not a copy of its value...
let score = 10
const readScore = () => score
score = 20
console.log(readScore())

// ...but a const captured in a call is fixed for that call. React's state works like this.
function snapshot(value: number) {
  return () => `value at creation: ${value}`
}
let current = 1
const show = snapshot(current)
current = 2
console.log(show(), '| now:', current)
