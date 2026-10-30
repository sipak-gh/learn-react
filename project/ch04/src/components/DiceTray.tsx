import type { Die as DieModel } from '../game/types'
import { Die } from './Die'

interface DiceTrayProps {
  dice: readonly DieModel[]
}

export function DiceTray({ dice }: DiceTrayProps) {
  return (
    <div className="dice-tray">
      {dice.map((die) => (
        // `key` tells React which die is which between renders.
        <Die key={die.id} value={die.value} held={die.held} />
      ))}
    </div>
  )
}
