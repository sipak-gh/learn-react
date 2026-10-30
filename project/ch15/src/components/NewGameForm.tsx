import { useActionState, useId, useState } from 'react'
import { MAX_NAME_LENGTH, MAX_PLAYERS, validatePlayerNames } from '../game/rules'
import type { GameSetup } from '../game/types'
import buttons from '../styles/buttons.module.css'
import styles from './NewGameForm.module.css'

interface NewGameFormProps {
  onStart: (setup: GameSetup) => void
}

/** What the form action returns: kept by useActionState between submissions. */
interface FormState {
  error: string | null
  /** The submitted checkbox value, to show it again after a failed submit. */
  fiveOfAKindBonus: boolean
}

interface PlayerRow {
  /** Stable identity for the `key`. Never the array index: rows can be removed. */
  id: number
  name: string
}

export function NewGameForm({ onStart }: NewGameFormProps) {
  // Controlled inputs: React state is the single source of truth for the names.
  const [rows, setRows] = useState<PlayerRow[]>([{ id: 1, name: 'Player 1' }])
  // useId makes ids that are unique on the page, for pairing labels with inputs.
  const formId = useId()

  // useActionState runs `startGame` when the form is submitted and keeps
  // whatever it returns as `formState` for the next render.
  const [formState, formAction] = useActionState(startGame, {
    error: null,
    fiveOfAKindBonus: true,
  })

  function startGame(_previous: FormState, formData: FormData): FormState {
    // The checkbox is uncontrolled: read its value from the submitted form data.
    // An unchecked checkbox is simply missing from the form data.
    const fiveOfAKindBonus = formData.get('fiveOfAKindBonus') === 'on'
    const playerNames = rows.map((row) => row.name.trim())
    const error = validatePlayerNames(playerNames)
    if (!error) onStart({ playerNames, settings: { fiveOfAKindBonus } })
    return { error, fiveOfAKindBonus }
  }

  function addPlayer() {
    // Derive the next id from the existing rows: no extra state needed.
    const id = Math.max(0, ...rows.map((row) => row.id)) + 1
    setRows([...rows, { id, name: `Player ${id}` }])
  }

  function removePlayer(id: number) {
    setRows(rows.filter((row) => row.id !== id))
  }

  function renamePlayer(id: number, name: string) {
    setRows(rows.map((row) => (row.id === id ? { ...row, name } : row)))
  }

  return (
    <form className={styles.form} action={formAction}>
      <fieldset className={styles.fieldset}>
        <legend>Players</legend>
        {rows.map((row, index) => {
          const inputId = `${formId}-player-${row.id}`
          return (
            <div key={row.id} className={styles.row}>
              <label htmlFor={inputId}>Player {index + 1}</label>
              <input
                id={inputId}
                value={row.name}
                onChange={(event) => renamePlayer(row.id, event.target.value)}
                maxLength={MAX_NAME_LENGTH}
                autoComplete="off"
              />
              <button
                type="button"
                className={buttons.secondary}
                onClick={() => removePlayer(row.id)}
                disabled={rows.length === 1}
                aria-label={`Remove player ${index + 1}`}
              >
                Remove
              </button>
            </div>
          )
        })}
        <button
          type="button"
          className={buttons.secondary}
          onClick={addPlayer}
          disabled={rows.length === MAX_PLAYERS}
        >
          Add player
        </button>
      </fieldset>

      <label className={styles.checkbox}>
        {/* After an action, React resets the form's uncontrolled fields to their
            defaults, so the default is the value that was just submitted. */}
        <input type="checkbox" name="fiveOfAKindBonus" defaultChecked={formState.fiveOfAKindBonus} />
        +100 bonus for each extra Five of a Kind
      </label>

      {formState.error && (
        <p className={styles.error} role="alert">
          {formState.error}
        </p>
      )}

      <button type="submit" className={buttons.primary}>
        Start game
      </button>
    </form>
  )
}
