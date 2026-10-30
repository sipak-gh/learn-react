import { useRef, type Ref } from 'react'
import { flushSync } from 'react-dom'
import { getPhase } from '../game/reducer'
import { CATEGORIES } from '../game/rules'
import { totals } from '../game/scoring'
import type { Category } from '../game/types'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useGameDispatch, useGameState } from '../hooks/useGame'
import { Announcer } from './Announcer'
import { DiceTray } from './DiceTray'
import { GameOver } from './GameOver'
import { Leaderboard } from './Leaderboard'
import { Panel } from './Panel'
import { Scoreboard } from './Scoreboard'
import { Scorecard } from './Scorecard'
import styles from './Game.module.css'

interface GameProps {
  onPlayAgain: () => void
  /** Attached to the board's first heading, so App can move focus there. */
  headingRef?: Ref<HTMLHeadingElement>
}

/** Lays out the board. The pieces read the game from context themselves. */
export function Game({ onPlayAgain, headingRef }: GameProps) {
  const state = useGameState()
  const dispatch = useGameDispatch()

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
    // The score button we clicked is about to disappear, which would drop
    // keyboard focus to <body>. Move it to the Roll button instead. flushSync
    // applies the update right now, so the button is already enabled again
    // (it was disabled with no rolls left) when we call focus().
    flushSync(() => dispatch({ type: 'score', category }))
    rollButtonRef.current?.focus()
  }

  return (
    <main className={styles.board}>
      <div className={styles.stack}>
        <Panel title={phase === 'gameOver' ? 'Game over' : `${player.name}'s turn`} titleRef={headingRef}>
          {phase === 'gameOver' ? <GameOver onPlayAgain={onPlayAgain} /> : <DiceTray rollButtonRef={rollButtonRef} />}
        </Panel>
        <Panel title="Standings">
          <Scoreboard />
        </Panel>
        {phase === 'gameOver' && (
          <Panel title="Leaderboard">
            <Leaderboard
              results={state.players.map((player) => ({ name: player.name, score: totals(player.sheet).grand }))}
            />
          </Panel>
        )}
      </div>

      <Panel title="Scorecard">
        <Scorecard onScore={handleScore} />
      </Panel>

      <Announcer />
    </main>
  )
}
