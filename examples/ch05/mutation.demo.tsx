import { useState } from 'react'

export default function MutationDemo() {
  const [values, setValues] = useState([3, 5])
  const [other, setOther] = useState(0)

  function handleMutate() {
    values.push(6) // changes the array React is holding...
    setValues(values) // ...and passes the same array back
    console.log('values is now', values)
  }

  function handleCopy() {
    setValues([...values, 6]) // a new array
  }

  return (
    <>
      <h1>Values: {values.join(', ')}</h1>
      <p>Other state: {other}</p>
      <button type="button" onClick={handleMutate}>
        Push 6 (mutate)
      </button>{' '}
      <button type="button" onClick={handleCopy}>
        Add 6 (copy)
      </button>{' '}
      <button type="button" onClick={() => setOther(other + 1)}>
        Change other state
      </button>
    </>
  )
}
