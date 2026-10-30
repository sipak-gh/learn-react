// A reducer is plain TypeScript. You can run and test it without React or a browser.

// The state is itself a discriminated union: only a locked door has a code.
type DoorState = { phase: 'open' } | { phase: 'closed' } | { phase: 'locked'; code: string }

type DoorAction =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'lock'; code: string }
  | { type: 'unlock'; code: string }

function doorReducer(state: DoorState, action: DoorAction): DoorState {
  switch (action.type) {
    case 'open':
      return state.phase === 'closed' ? { phase: 'open' } : state
    case 'close':
      return state.phase === 'open' ? { phase: 'closed' } : state
    case 'lock':
      return state.phase === 'closed' ? { phase: 'locked', code: action.code } : state
    case 'unlock':
      return state.phase === 'locked' && state.code === action.code ? { phase: 'closed' } : state
    default: {
      // Every action type is handled above, so `action` has type `never` here.
      const unhandled: never = action
      throw new Error(`Unknown action: ${JSON.stringify(unhandled)}`)
    }
  }
}

const actions: DoorAction[] = [
  { type: 'lock', code: '1234' }, // the door is open: ignored
  { type: 'close' },
  { type: 'lock', code: '1234' },
  { type: 'open' }, // locked: ignored
  { type: 'unlock', code: '0000' }, // wrong code: ignored
  { type: 'unlock', code: '1234' },
  { type: 'open' },
]

let state: DoorState = { phase: 'open' }
for (const action of actions) {
  const next = doorReducer(state, action)
  // An ignored action returns the very same object.
  console.log(JSON.stringify(action).padEnd(32), next === state ? 'ignored' : `-> ${next.phase}`)
  state = next
}

// Replaying the same actions from the same start always gives the same result.
console.log(actions.reduce(doorReducer, { phase: 'open' }))
