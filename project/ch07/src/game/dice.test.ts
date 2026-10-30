import { describe, expect, it } from 'vitest'
import { applyRoll, createDice, createSeededRng, rollDice, rollDie, toggleHold } from './dice'

describe('rollDie', () => {
  it('maps the range [0, 1) onto the faces 1 to 6', () => {
    expect(rollDie(() => 0)).toBe(1)
    expect(rollDie(() => 0.5)).toBe(4)
    expect(rollDie(() => 0.9999)).toBe(6)
  })
})

describe('createSeededRng', () => {
  it('repeats the same sequence for the same seed', () => {
    const first = rollDice(createSeededRng(42))
    const second = rollDice(createSeededRng(42))
    expect(first).toEqual(second)
  })

  it('only ever produces faces 1 to 6, and all of them', () => {
    const values = rollDice(createSeededRng(1), 600)
    expect(values.every((v) => v >= 1 && v <= 6)).toBe(true)
    expect(new Set(values).size).toBe(6)
  })
})

describe('applyRoll', () => {
  it('changes only the dice that are not held', () => {
    const dice = createDice([1, 1, 1, 1, 1]).map((die) =>
      die.id === 0 ? { ...die, held: true } : die,
    )
    const result = applyRoll(dice, [6, 6, 6, 6, 6])
    expect(result.map((die) => die.value)).toEqual([1, 6, 6, 6, 6])
  })

  it('does not mutate the original dice', () => {
    const dice = createDice()
    const copy = structuredClone(dice)
    const result = applyRoll(dice, [6, 6, 6, 6, 6])
    expect(dice).toEqual(copy)
    expect(result).not.toBe(dice)
  })
})

describe('toggleHold', () => {
  it('flips only the chosen die', () => {
    const once = toggleHold(createDice(), 2)
    expect(once.map((die) => die.held)).toEqual([false, false, true, false, false])
    const twice = toggleHold(once, 2)
    expect(twice.every((die) => !die.held)).toBe(true)
  })
})
