import { useRef } from 'react'
import { flushSync } from 'react-dom'
import { gameReducer, getPhase, type GameAction } from '../game/reducer'
import { CATEGORIES } from '../game/rules'
import type { Category } from '../game/types'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useGameDispatch, useGameState } from '../hooks/useGame'
import { useHighScores } from '../hooks/useHighScores'
import { DiceTray } from './DiceTray'
import { GameOver } from './GameOver'
import { Panel } from './Panel'
import { Scoreboard } from './Scoreboard'
import { Scorecard } from './Scorecard'
import { HighScores } from './HighScores'

interface GameProps {
  onPlayAgain: () => void
}

/** Lays out the board. The pieces read the game from context themselves. */
export function Game({ onPlayAgain }: GameProps) {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const { recordGame } = useHighScores()

  // Filled in by React with the Roll button's DOM node (null until then).
  const rollButtonRef = useRef<HTMLButtonElement>(null)

  const phase = getPhase(state)
  const player = state.players[state.current]
  const turn = Object.keys(player.sheet.scores).length + 1
  const title =
    phase === 'gameOver'
      ? 'Game over · Five Dice'
      : `${player.name} · turn ${turn}/${CATEGORIES.length} · Five Dice`
  useDocumentTitle(title)

  function handleScore(category: Category) {
    const action: GameAction = { type: 'score', category }
    // Does this score end the game? The reducer is a pure function, so we can
    // simply call it to look ahead. Recording the result belongs to this
    // event, so it happens here, not in an Effect.
    const next = gameReducer(state, action)
    if (getPhase(next) === 'gameOver' && next !== state) {
      recordGame(next.players)
    }

    // The score button we clicked is about to disappear, which would drop
    // keyboard focus to <body>. Move it to the Roll button instead. flushSync
    // applies the update right now, so the button is already enabled again
    // (it was disabled with no rolls left) when we call focus().
    flushSync(() => dispatch(action))
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
        {phase === 'gameOver' && (
          <Panel title="High scores">
            <HighScores />
          </Panel>
        )}
      </div>

      <Panel title="Scorecard">
        <Scorecard onScore={handleScore} />
      </Panel>
    </main>
  )
}
