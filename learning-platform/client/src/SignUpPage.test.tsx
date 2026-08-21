import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import SignUpPage from './SignUpPage'

// Covers SIGNUP-EXPEDITE-001's DoD (active_sprint/story_expedite_sign_up.md):
// the expedite option is shown only once GET /api/config confirms the flag,
// and is absent while that hasn't happened yet / the flag is off.

describe('SignUpPage (SIGNUP-EXPEDITE-001)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not show the expedite option before /api/config resolves', () => {
    // given: fetch never resolves within this assertion's timeframe
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

    // when: the signup page renders
    render(<SignUpPage />)

    // then: the expedite option is not shown yet
    expect(screen.queryByRole('button', { name: /expedite sign up/i })).not.toBeInTheDocument()
  })

  it('shows the expedite option once /api/config reports the flag enabled', async () => {
    // given: the server reports the expedite flag on
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ expediteSignupEnabled: true }) })),
    )

    // when: the signup page renders and the config fetch resolves
    render(<SignUpPage />)

    // then: the expedite option appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /expedite sign up/i })).toBeInTheDocument()
    })
  })

  it('keeps the expedite option hidden when the flag is reported disabled', async () => {
    // given: the server reports the expedite flag off
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ expediteSignupEnabled: false }) })),
    )

    // when: the signup page renders and the config fetch resolves
    render(<SignUpPage />)
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled())

    // then: the expedite option stays absent
    expect(screen.queryByRole('button', { name: /expedite sign up/i })).not.toBeInTheDocument()
  })

  it('always shows the normal email/password sign-up form', () => {
    // given: config hasn't resolved yet
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

    // when: the signup page renders
    render(<SignUpPage />)

    // then: the normal sign-up fields and submit are present regardless
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign up$/i })).toBeInTheDocument()
  })
})
