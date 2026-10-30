/** How many dice show each face: index 0 counts the 1s, index 5 counts the 6s. */
export function countFaces(values: readonly number[]): number[] {
  return values.reduce(
    (counts, value) => counts.with(value - 1, counts[value - 1] + 1),
    [0, 0, 0, 0, 0, 0],
  )
}
