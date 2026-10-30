import { useRef, useState } from 'react'

const PLAYERS = ['Ada', 'Bo', 'Cy', 'Di', 'Ed', 'Flo', 'Gus', 'Hal']

export default function PlayerList() {
  const [players, setPlayers] = useState(PLAYERS.slice(0, 3))
  // One ref, many nodes: a Map from name to <li>, kept up to date by ref callbacks.
  const nodes = useRef(new Map<string, HTMLLIElement>())

  function highlight(name: string) {
    const node = nodes.current.get(name)
    node?.scrollIntoView({ block: 'nearest' })
    node?.animate([{ background: 'gold' }, { background: 'transparent' }], { duration: 800 })
  }

  return (
    <main>
      <button type="button" onClick={() => setPlayers(PLAYERS.slice(0, players.length + 1))}>
        Add player
      </button>{' '}
      <button type="button" onClick={() => setPlayers(players.slice(1))}>
        Remove first
      </button>{' '}
      <button type="button" onClick={() => highlight(players[players.length - 1])}>
        Highlight last
      </button>
      <ul style={{ maxHeight: '6rem', overflowY: 'auto' }}>
        {players.map((name) => (
          <li
            key={name}
            ref={(node) => {
              // The type allows null, but with a cleanup React never passes it.
              if (!node) return
              // Called with the node after React attaches it…
              console.log(`attach ${name}`)
              nodes.current.set(name, node)
              // …and the returned cleanup runs when React detaches it.
              return () => {
                console.log(`detach ${name}`)
                nodes.current.delete(name)
              }
            }}
          >
            {name}
          </li>
        ))}
      </ul>
    </main>
  )
}
