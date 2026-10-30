// An IMPURE component: it changes a variable outside itself while rendering.
let guest = 0

function ImpureCup() {
  // oxlint-disable-next-line react/globals -- impure on purpose, to show the problem
  guest = guest + 1
  return <li>Tea cup for guest #{guest}</li>
}

// The pure version: the same props always give the same output.
function Cup({ guest }: { guest: number }) {
  return <li>Tea cup for guest #{guest}</li>
}

export default function Purity() {
  return (
    <>
      <h2>Impure</h2>
      <ul>
        <ImpureCup />
        <ImpureCup />
        <ImpureCup />
      </ul>
      <h2>Pure</h2>
      <ul>
        <Cup guest={1} />
        <Cup guest={2} />
        <Cup guest={3} />
      </ul>
    </>
  )
}
