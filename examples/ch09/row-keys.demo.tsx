import { useState } from 'react'

interface Row {
  id: number
  name: string
}

const START: Row[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Bo' },
  { id: 3, name: 'Cy' },
]

function Rows({ useIndexKey }: { useIndexKey: boolean }) {
  const [rows, setRows] = useState(START)

  return (
    <ul>
      {rows.map((row, index) => (
        <li key={useIndexKey ? index : row.id}>
          {/* Uncontrolled: defaultValue is only used when the input is created. */}
          <input aria-label={`Name ${index + 1}`} defaultValue={row.name} />{' '}
          <button type="button" onClick={() => setRows(rows.filter((r) => r.id !== row.id))}>
            Remove {row.name}
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function RowKeys() {
  return (
    <main>
      <h2>key=index</h2>
      <Rows useIndexKey />
      <h2>key=row.id</h2>
      <Rows useIndexKey={false} />
    </main>
  )
}
