import { useContext, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { getPhase } from '../game/reducer'
import { CATEGORIES } from '../game/rules'
import type { Category } from '../game/types'
import { DiceTray } from './DiceTray'
import { GameOver } from './GameOver'
import { Panel } from './Panel'
import { Scoreboard } from './Scoreboard'
import { Scorecard } from './Scorecard'
import { GameDispatchContext, GameStateContext } from './contexts'

interface GameProps {
  onPlayAgain: () => void
}

/** Lays out the board. The pieces read the game from context themselves. */
export function Game({ onPlayAgain }: GameProps) {
  const state = useContext(GameStateContext)
  const dispatch = useContext(GameDispatchContext)
  if (!state || !dispatch) throw new Error('Game must be used inside <GameProvider>')

  // Filled in by React with the Roll button's DOM node (null until then).
  const rollButtonRef = useRef<HTMLButtonElement>(null)

  const phase = getPhase(state)
  const player = state.players[state.current]
  const turn = Object.keys(player.sheet.scores).length + 1
  const title =
    phase === 'gameOver'
      ? 'Game over · Five Dice'
      : `${player.name} · turn ${turn}/${CATEGORIES.length} · Five Dice`

  // The browser tab's title lives outside React: synchronise it with an Effect.
  useEffect(() => {
    document.title = title
    // Cleanup runs before the next sync and when Game unmounts.
    return () => {
      document.title = 'Five Dice'
    }
  }, [title])

  const handleScore = (category: Category) => {
    // The score button we clicked is about to disappear, which would drop
    // keyboard focus to <body>. Move it to the Roll button instead. flushSync
    // applies the update right now, so the button is already enabled again
    // (it was disabled with no rolls left) when we call focus().
    flushSync(() => dispatch({ type: 'score', category }))
    rollButtonRef.current?.focus()
  }

  return (
    <main className="board">
      <div className="stack">
        <Panel title={phase === 'gameOver' ? 'Game over' : `${player.name}'s turn`}>
          {phase === 'gameOver' ? <GameOver onPlayAgain={onPlayAgain} /> : <DiceTray rollButtonRef={rollButtonRef} />}
        </Panel>
        <Panel title="Standings">
          <Scoreboard />
        </Panel>
      </div>

      <Panel title="Scorecard">
        <Scorecard onScore={handleScore} />
      </Panel>
    </main>
  )
}
