import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Covers HOME-001's Definition of Done (active_sprint/story_access_home_page.md):
// - header states the product name, styled distinctly from the body
// - a sign-in/log-in button is visible, centered in the body

describe('App (home page, HOME-001)', () => {
  it('shows a header with the product name', () => {
    // given: an unregistered user opens the home page
    render(<App />)

    // when: the page has rendered
    // then: the header states the product name
    const header = screen.getByText('Learning Platform').closest('header')
    expect(header).not.toBeNull()
  })

  it('shows a sign-in button centered in the body', () => {
    // given: an unregistered user opens the home page
    render(<App />)

    // when: the page has rendered
    // then: a sign-in button is visible, inside the main body area (not the header)
    const button = screen.getByRole('button', { name: /sign in/i })
    expect(button).toBeInTheDocument()
    expect(button.closest('main')).not.toBeNull()
    expect(button.closest('header')).toBeNull()
  })

  // Covers SIGNUP-EXPEDITE-001: /signup exists but is unreachable from the
  // UI without a link pointing to it.
  it('shows a sign-up link pointing to /signup', () => {
    // given: an unregistered user opens the home page
    render(<App />)

    // when: the page has rendered
    // then: a sign-up link is visible and points at /signup
    const link = screen.getByRole('link', { name: /sign up/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/signup')
  })
})
