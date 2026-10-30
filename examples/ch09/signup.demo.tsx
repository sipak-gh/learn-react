import { useActionState, useId } from 'react'
import { useFormStatus } from 'react-dom'

type Plan = 'free' | 'pro'

interface SignupValues {
  email: string
  plan: Plan
  newsletter: boolean
}

interface SignupState {
  /** What was submitted last, to show it again after an error. */
  values: SignupValues
  error: string | null
  done: boolean
}

interface SignupProps {
  /** Sends the sign-up to a server. Resolves to an error message, or null. Tests pass a fake. */
  register?: (values: SignupValues) => Promise<string | null>
}

// Pretends to be a server that needs a second to answer.
function fakeRegister(values: SignupValues): Promise<string | null> {
  return new Promise((resolve) => {
    const taken = values.email.toLowerCase() === 'ada@example.com'
    setTimeout(() => resolve(taken ? 'That email is already registered.' : null), 1000)
  })
}

const initialState: SignupState = {
  values: { email: '', plan: 'free', newsletter: true },
  error: null,
  done: false,
}

function SubmitButton() {
  // Reads the status of the <form> that this component is rendered inside.
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Signing up…' : 'Sign up'}
    </button>
  )
}

export default function Signup({ register = fakeRegister }: SignupProps) {
  const id = useId()

  // The action gets the previous state and the form data, and returns the next state.
  // It may be async and may have side effects, unlike a reducer.
  async function signUp(_previous: SignupState, formData: FormData): Promise<SignupState> {
    const values: SignupValues = {
      email: String(formData.get('email')).trim(),
      plan: formData.get('plan') === 'pro' ? 'pro' : 'free',
      newsletter: formData.get('newsletter') === 'on',
    }
    if (!values.email.includes('@')) {
      return { values, error: 'Enter an email address.', done: false }
    }
    const error = await register(values)
    return { values, error, done: error === null }
  }

  const [state, formAction] = useActionState(signUp, initialState)

  if (state.done) {
    return <p>Welcome! We sent a link to {state.values.email}.</p>
  }

  const errorId = `${id}-error`
  return (
    // noValidate: the action checks the email and shows its own accessible error.
    <form action={formAction} noValidate>
      <p>
        <label htmlFor={`${id}-email`}>Email</label>{' '}
        <input
          id={`${id}-email`}
          type="email"
          name="email"
          defaultValue={state.values.email}
          aria-invalid={state.error !== null}
          aria-describedby={state.error ? errorId : undefined}
        />
      </p>
      <p>
        <label htmlFor={`${id}-plan`}>Plan</label>{' '}
        <select
          id={`${id}-plan`}
          name="plan"
          defaultValue={state.values.plan}
          // A <select> uses defaultValue only when it is created. The key makes a
          // new one whenever the submitted plan changes, so the reset keeps it.
          key={state.values.plan}
        >
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
      </p>
      <p>
        <label>
          <input type="checkbox" name="newsletter" defaultChecked={state.values.newsletter} /> Send me the newsletter
        </label>
      </p>
      {state.error && (
        <p id={errorId} role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  )
}
