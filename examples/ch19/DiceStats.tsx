// Loaded on demand by lazy.demo.tsx. lazy() wants a module whose default
// export is a component.

/** Every possible roll of five dice: 6^5 = 7776 of them. */
function allRolls(): number[][] {
  let rolls: number[][] = [[]]
  for (let die = 0; die < 5; die++) {
    rolls = rolls.flatMap((roll) => [1, 2, 3, 4, 5, 6].map((face) => [...roll, face]))
  }
  return rolls
}

const most = (roll: number[]) => Math.max(...[1, 2, 3, 4, 5, 6].map((f) => roll.filter((d) => d === f).length))
const isRun = (roll: number[], length: number) =>
  [1, 2, 3].some((start) => Array.from({ length }, (_, i) => start + i).every((face) => roll.includes(face)))

const odds: [string, (roll: number[]) => boolean][] = [
  ['Three of a Kind', (roll) => most(roll) >= 3],
  ['Small Straight', (roll) => isRun(roll, 4)],
  ['Large Straight', (roll) => isRun(roll, 5)],
  ['Five of a Kind', (roll) => most(roll) === 5],
]

export default function DiceStats() {
  const rolls = allRolls()
  return (
    <table>
      <caption>Chance in a single roll</caption>
      <tbody>
        {odds.map(([name, test]) => (
          <tr key={name}>
            <th scope="row">{name}</th>
            <td>{((rolls.filter(test).length / rolls.length) * 100).toFixed(2)} %</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
