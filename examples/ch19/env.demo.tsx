// The values Vite puts in import.meta.env. Open ?demo=ch19/env
const env = import.meta.env

const rows: [name: string, value: unknown][] = [
  ['MODE', env.MODE],
  ['DEV', env.DEV],
  ['PROD', env.PROD],
  ['BASE_URL', env.BASE_URL],
  ['SSR', env.SSR],
  // Your own variables need the VITE_ prefix to reach browser code.
  ['VITE_GREETING', env.VITE_GREETING],
]

export default function EnvDemo() {
  return (
    <table>
      <caption>import.meta.env</caption>
      <tbody>
        {rows.map(([name, value]) => (
          <tr key={name}>
            <th scope="row">{name}</th>
            <td>{JSON.stringify(value) ?? 'undefined'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
