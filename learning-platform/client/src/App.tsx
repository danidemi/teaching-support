import './App.css'

const PRODUCT_NAME = 'Learning Platform'

/**
 * Home page for HOME-001: reachable without signing in. A top header
 * (styled distinctly from the body) states the product name; the sign-in
 * button sits centered in the body.
 *
 * The sign-in button is an inert placeholder for this story — it has no
 * wired action yet. LOGIN-001 wires it to the Google sign-in flow.
 */
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <span>{PRODUCT_NAME}</span>
      </header>
      <main className="app-body">
        <button type="button" className="sign-in-button">
          Sign in
        </button>
      </main>
    </div>
  )
}

export default App
