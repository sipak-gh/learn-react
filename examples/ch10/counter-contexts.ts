import { createContext, type Dispatch } from 'react'

export type CountAction = { type: 'add'; amount: number } | { type: 'reset' }

export function countReducer(count: number, action: CountAction): number {
  switch (action.type) {
    case 'add':
      return count + action.amount
    case 'reset':
      return 0
  }
}

// null = "no provider above": a bug that the consumers report.
export const CountContext = createContext<number | null>(null)
export const CountDispatchContext = createContext<Dispatch<CountAction> | null>(null)
