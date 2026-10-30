import { useMediaQuery } from './use-media-query'

export default function MediaQueryDemo() {
  const wide = useMediaQuery('(min-width: 40rem)')
  const dark = useMediaQuery('(prefers-color-scheme: dark)')
  const calm = useMediaQuery('(prefers-reduced-motion: reduce)')

  return (
    <main>
      <h1>Media queries</h1>
      <ul>
        <li>Window: {wide ? 'wide (40rem or more)' : 'narrow'}</li>
        <li>Color scheme: {dark ? 'dark' : 'light'}</li>
        <li>Motion: {calm ? 'reduced' : 'no preference'}</li>
      </ul>
      <p>Resize the window or change your system settings: the list updates by itself.</p>
    </main>
  )
}
