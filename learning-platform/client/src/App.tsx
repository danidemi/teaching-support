import './App.css'

const PRODUCT_NAME = 'Learning Platform'

/**
 * Home page for HOME-001: reachable without signing in. A top header
 * (styled distinctly from the body) states the product name; the sign-in
 * button sits centered in the body.
 *
 * The sign-in button is an inert placeholder for this story — it has no
 * wired action yet. LOGIN-001 wires it to the Google sign-in flow.
 *
 * The "Sign up" link (added for SIGNUP-EXPEDITE-001) is the only way to
 * reach `/signup` from the UI — without it the route existed but nothing
 * pointed to it. A plain <a>, not react-router's <Link>, so App.tsx keeps
 * needing no <Router> ancestor and App.test.tsx (which renders <App />
 * standalone) needed no change.
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
        <a href="/signup" className="sign-up-link">
          Sign up
        </a>
      </main>
    </div>
  )
}

export default App
