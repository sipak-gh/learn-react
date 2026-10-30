import type { GameEvent } from '../game/reducer'
import { CATEGORY_LABELS } from '../game/rules'
import { useGameState } from '../hooks/useGame'

function announcement(event: GameEvent): string {
  switch (event.type) {
    case 'rolled': {
      const { rollsLeft } = event
      const rolls =
        rollsLeft === 0 ? 'That was the last roll.' : `${rollsLeft} ${rollsLeft === 1 ? 'roll' : 'rolls'} left.`
      return `${event.player} rolled ${event.values.join(', ')}. ${rolls}`
    }
    case 'scored': {
      const bonus = event.bonus ? ' Five of a Kind bonus: plus 100!' : ''
      return `${event.player} scored ${event.points} in ${CATEGORY_LABELS[event.category]}.${bonus}`
    }
  }
}

/**
 * A live region: screen readers read out changes to its text, without moving
 * focus. It must already be on the page before the text changes, so it is
 * always rendered, and empty until something happens.
 */
export function Announcer() {
  const { lastEvent } = useGameState()

  return (
    <p role="status" className="visually-hidden">
      {lastEvent ? announcement(lastEvent) : ''}
    </p>
  )
}
