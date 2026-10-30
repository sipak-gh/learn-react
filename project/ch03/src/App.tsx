// The page skeleton. It looks like HTML, but it is JSX: note `className`
// instead of `class`. Chapter 4 explains JSX properly.
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Five Dice</h1>
      </header>

      <main className="board">
        <section className="panel">
          <h2>Dice</h2>
          <p>The dice tray goes here.</p>
        </section>

        <section className="panel">
          <h2>Scorecard</h2>
          <p>The scorecard goes here.</p>
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Rules: <a href="https://beesboardsma.com/pages/five-dice">Five Dice</a>
        </p>
      </footer>
    </div>
  )
}

export default App
