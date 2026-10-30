interface TurnStatusProps {
  player: string
  rollsLeft: number
  held: number
}

function TurnStatus({ player, rollsLeft, held }: TurnStatusProps) {
  // 1. if + early return: pick a whole different output.
  if (rollsLeft === 0) {
    return <p>{player}: no rolls left, pick a category.</p>
  }

  // 2. A variable that holds JSX (or nothing).
  let hint = null
  if (rollsLeft < 3) {
    hint = <em> Click a die to hold it.</em>
  }

  return (
    <p>
      {/* 3. Ternary: choose between two values. */}
      {player}: {rollsLeft === 3 ? 'roll to start' : `${rollsLeft} rolls left`}
      {/* 4. &&: render something or nothing. */}
      {held > 0 && `, holding ${held}`}.{hint}
    </p>
  )
}

// 5. Returning null renders nothing at all.
function Nothing() {
  return null
}

// The && trap: when `held` is 0, `held && …` evaluates to 0, and React renders numbers.
function ZeroBug({ held }: { held: number }) {
  return <p>Bug: {held && `${held} held`}</p>
}

export default function Conditional() {
  return (
    <>
      <TurnStatus player="Ada" rollsLeft={3} held={0} />
      <TurnStatus player="Bo" rollsLeft={2} held={2} />
      <TurnStatus player="Cy" rollsLeft={0} held={5} />
      <Nothing />
      <ZeroBug held={0} />
    </>
  )
}
