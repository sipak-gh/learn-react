// The rules of JSX in one component.
const player = { name: 'Ada', score: 42 }

export default function JsxRules() {
  const label = 'Hold dice automatically'

  return (
    // One root element. A fragment (<>…</>) groups siblings without adding a DOM node.
    <>
      {/* Comments inside JSX go in braces like this. */}
      <h1 className="title">JSX rules</h1>

      {/* `htmlFor` instead of `for`; every tag must be closed, even <input />. */}
      <input type="checkbox" id="auto-hold" />
      <label htmlFor="auto-hold">{label}</label>

      {/* A style object: camelCase property names; plain numbers mean pixels. */}
      <p style={{ fontWeight: 'bold', marginTop: 8 }}>
        {player.name} has {player.score} points, {player.score >= 40 ? 'well done' : 'keep going'}.
      </p>

      <p>Any expression works in braces: 6 × 7 = {6 * 7}</p>
      <p>Text is escaped, never parsed as HTML: {'<b>not bold</b>'}</p>
      <p>
        These render nothing: [{null}] [{undefined}] [{false}] [{true}], but zero does: [{0}]
      </p>
    </>
  )
}
