import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConfirmResultPage from './ConfirmResultPage'

// Covers SIGN-UP-001's DoD (active_sprint/story_sign_in_with_own_email.md):
// /confirm-result renders a distinct message for each ?status= value.

function renderWithStatus(status: string | null) {
  const query = status === null ? '' : `?status=${status}`
  window.history.pushState({}, '', `/confirm-result${query}`)
  render(<ConfirmResultPage />)
}

describe('ConfirmResultPage (SIGN-UP-001)', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('shows a success message for status=ok', () => {
    // given: the confirm link was valid and unused
    renderWithStatus('ok')

    // when/then: a success message is shown
    expect(screen.getByRole('status')).toHaveTextContent(/confirmed/i)
  })

  it('shows an expired message for status=expired', () => {
    // given: the confirm link had expired
    renderWithStatus('expired')

    // when/then: an expired message is shown
    expect(screen.getByRole('status')).toHaveTextContent(/expired/i)
  })

  it('shows a used message for status=used', () => {
    // given: the confirm link had already been used
    renderWithStatus('used')

    // when/then: a used message is shown
    expect(screen.getByRole('status')).toHaveTextContent(/already been used/i)
  })

  it('shows an invalid message for status=invalid', () => {
    // given: the token was unrecognized
    renderWithStatus('invalid')

    // when/then: an invalid message is shown
    expect(screen.getByRole('status')).toHaveTextContent(/not valid/i)
  })

  it('falls back to the invalid message when no status is given', () => {
    // given: the page is opened with no ?status= at all
    renderWithStatus(null)

    // when/then: the invalid message is shown rather than nothing
    expect(screen.getByRole('status')).toHaveTextContent(/not valid/i)
  })
})
