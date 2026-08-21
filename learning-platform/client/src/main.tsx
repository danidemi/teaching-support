import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import SignUpPage from './SignUpPage'

// Router + route table live here, not in App.tsx, so App.tsx keeps
// rendering standalone (no <Router> ancestor needed) for App.test.tsx —
// decided during SIGNUP-EXPEDITE-001 development, see ADR-0004.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
