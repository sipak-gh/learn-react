import { useContext } from 'react'
import { getPhase } from '../game/reducer'
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
