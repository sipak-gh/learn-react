import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import ComponentApisDemo from './component-apis.demo'

// The <section> that holds the heading with this text.
const card = (title: string) => screen.getByRole('heading', { name: title }).closest('section')!

it('fills children, slots and render props', () => {
  render(<ComponentApisDemo />)
  const standings = card('Standings')
  const items = within(standings).getAllByRole('listitem').map((li) => li.textContent)
  expect(items).toEqual(['🏆 Ada: 212', 'Bo: 187'])
  expect(within(standings).getByRole('button', { name: 'Share' })).toBeInTheDocument()

  const waiting = card('Waiting room')
  expect(waiting).toHaveTextContent('Nobody yet.')
  expect(within(waiting).queryByRole('button')).not.toBeInTheDocument()
})
