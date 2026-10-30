import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import BadgeDemo from './badge.demo'
import styles from './badge.module.css'

it('puts the module class names on the elements', () => {
  render(<BadgeDemo />)
  // Ask the module for the real name; never hard-code it.
  expect(screen.getByText('New')).toHaveClass(styles.badge)
  expect(screen.getByText('Big beta')).toHaveClass(styles.warning, styles.large)
  // In tests, the module is a stand-in: any key gives a name, even a typo.
  console.log(styles.badge, styles.warning, styles.typo)
})
