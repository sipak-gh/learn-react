import { useContext } from 'react'
import { GameDispatchContext, GameStateContext } from '../components/contexts'

/** The current game. Throws if used outside <GameProvider>, so callers never see null. */
export function useGameState() {
  const state = useContext(GameStateContext)
  if (!state) throw new Error('useGameState must be used inside <GameProvider>')
  return state
}

/** The game's dispatch function. Throws if used outside <GameProvider>. */
export function useGameDispatch() {
  const dispatch = useContext(GameDispatchContext)
  if (!dispatch) throw new Error('useGameDispatch must be used inside <GameProvider>')
  return dispatch
}
