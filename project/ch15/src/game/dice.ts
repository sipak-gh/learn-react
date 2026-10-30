import type { Die, DieValue } from './types'

/** A random number source: returns a float in [0, 1), just like Math.random. */
export type Rng = () => number

export const DICE_COUNT = 5

/** Roll one die. Pass your own `rng` to make the result predictable. */
export function rollDie(rng: Rng = Math.random): DieValue {
  // rng() is in [0, 1) → times 6 is in [0, 6) → floor gives 0..5 → plus 1 gives 1..6.
  return (Math.floor(rng() * 6) + 1) as DieValue
}

/** Roll `count` dice and return only the values. */
export function rollDice(rng: Rng = Math.random, count = DICE_COUNT): DieValue[] {
  return Array.from({ length: count }, () => rollDie(rng))
}

/** Make a fresh set of dice, none held. */
export function createDice(values: readonly DieValue[] = [1, 2, 3, 4, 5]): Die[] {
  return values.map((value, id) => ({ id, value, held: false }))
}

/**
 * Apply freshly rolled `values` to the dice: each die that is not held takes
 * the value at its position. Returns a new array and never mutates `dice`.
 */
export function applyRoll(dice: readonly Die[], values: readonly DieValue[]): Die[] {
  return dice.map((die, i) => (die.held ? die : { ...die, value: values[i] }))
}

/** Flip the `held` flag of the die with this `id`. Returns a new array. */
export function toggleHold(dice: readonly Die[], id: number): Die[] {
  return dice.map((die) => (die.id === id ? { ...die, held: !die.held } : die))
}

/**
 * A seeded pseudo-random generator (the "mulberry32" algorithm).
 * The same seed always gives the same sequence, which makes tests repeatable.
 * `state` lives in a closure: each call to the returned function updates it.
 */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0 // force to an unsigned 32-bit integer
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 // 2^32 → result in [0, 1)
  }
}
