import { useContext, useEffect } from 'react'
import { getPhase } from '../game/reducer'
import { CATEGORIES } from '../game/rules'
import { DiceTray } from './DiceTray'
import { GameOver } from './GameOver'
import { Panel } from './Panel'
import { Scoreboard } from './Scoreboard'
import { Scorecard } from './Scorecard'
import { GameStateContext } from './contexts'

interface GameProps {
  onPlayAgain: () => void
}

/** Lays out the board. The pieces read the game from context themselves. */
export function Game({ onPlayAgain }: GameProps) {
  const state = useContext(GameStateContext)
  if (!state) throw new Error('Game must be used inside <GameProvider>')

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

  return (
    <main className="board">
      <div className="stack">
        <Panel title={phase === 'gameOver' ? 'Game over' : `${player.name}'s turn`}>
          {phase === 'gameOver' ? <GameOver onPlayAgain={onPlayAgain} /> : <DiceTray />}
        </Panel>
        <Panel title="Standings">
          <Scoreboard />
        </Panel>
      </div>

      <Panel title="Scorecard">
        <Scorecard />
      </Panel>
    </main>
  )
}
