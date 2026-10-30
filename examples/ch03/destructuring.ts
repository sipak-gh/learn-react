interface Die {
  id: number
  value: number
  held: boolean
}
const die: Die = { id: 0, value: 3, held: false }

// Destructuring in a parameter list: React components receive their props like this.
// A default applies only when the value is undefined.
function label({ value, held = false }: { value: number; held?: boolean }) {
  return held ? `[${value}]` : `${value}`
}
console.log(label(die), label({ value: 6, held: true }), label({ value: 2 }))

// Pick some properties, collect the rest: how a component passes the other props on.
const { id, ...rest } = die
console.log(id, rest)

// Array destructuring picks by position. useState returns a [value, setter] pair you unpack this way.
const [first, second, ...others] = [6, 5, 4, 3, 2]
console.log(first, second, others)

// Spread copies with changes: later properties win, and the original is untouched.
const heldDie = { ...die, held: true }
const dice = [die, heldDie]
const more = [...dice, { ...die, id: 2 }]
console.log(heldDie, die.held, more.length)

// The copy is shallow: nested objects are shared, not copied.
const game = { round: 1, dice: [1, 2, 3] }
const copy = { ...game }
copy.dice.push(4)
console.log(game.dice, copy.dice === game.dice)
