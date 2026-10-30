import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  /** Shown instead of the children after an error; call `reset` to try again. */
  fallback: (error: unknown, reset: () => void) => ReactNode
  /** Called by `reset`, before the children render again: e.g. start a new request. */
  onReset?: () => void
  /** Report the error, e.g. to an error-tracking service. */
  onError?: (error: unknown, info: ErrorInfo) => void
  children: ReactNode
}

interface ErrorBoundaryState {
  error: unknown
  hasError: boolean
}

/**
 * Catches errors thrown while rendering its children, including a rejected
 * promise read with use(). There is no hook for this: error boundaries are
 * the one thing that still needs a class component.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, hasError: false }

  /** Render phase: turn the error into state, so the next render shows the fallback. */
  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error, hasError: true }
  }

  /**
   * Commit phase: the place for side effects such as reporting the error.
   * (React itself already logs caught errors with console.error.)
   */
  componentDidCatch(error: unknown, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  reset = () => {
    this.props.onReset?.()
    this.setState({ error: null, hasError: false })
  }

  render() {
    if (this.state.hasError) return this.props.fallback(this.state.error, this.reset)
    return this.props.children
  }
}
