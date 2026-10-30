import { useReducer } from 'react'
import { rollDice, type Rng } from '../game/dice'
import { createGame, gameReducer, getPhase } from '../game/reducer'
import { potentialScores } from '../game/scoring'
import type { Category, GameSetup } from '../game/types'
import { DiceTray } from './DiceTray'
import { GameOver } from './GameOver'
import { Panel } from './Panel'
import { Scorecard } from './Scorecard'

interface GameProps {
  setup: GameSetup
  rng: Rng
}

export function Game({ setup, rng }: GameProps) {
  // createGame(setup) builds the first state; later renders ignore `setup`.
  const [state, dispatch] = useReducer(gameReducer, setup, createGame)

  const phase = getPhase(state)
  const player = state.players[state.current]
  const values = state.dice.map((die) => die.value)
  const canScore = phase === 'rolling' || phase === 'mustScore'
  const potential = canScore ? potentialScores(player.sheet, values) : null

  function handleRoll() {
    dispatch({ type: 'roll', values: rollDice(rng) })
  }

  function handleScore(category: Category) {
    dispatch({ type: 'score', category })
  }

  return (
    <main className="board">
      <Panel title={phase === 'gameOver' ? 'Results' : `${player.name}'s turn`}>
        {phase === 'gameOver' ? (
          <GameOver players={state.players} onPlayAgain={() => dispatch({ type: 'newGame' })} />
        ) : (
          <DiceTray
            dice={state.dice}
            rollsLeft={state.rollsLeft}
            phase={phase}
            onRoll={handleRoll}
            onToggleHold={(id) => dispatch({ type: 'toggleHold', id })}
          />
        )}
      </Panel>

      <Panel title={`Scorecard: ${player.name}`}>
        <Scorecard sheet={player.sheet} potential={potential} onScore={handleScore} />
      </Panel>
    </main>
  )
}
