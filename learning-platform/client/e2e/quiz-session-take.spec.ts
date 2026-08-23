import { test, expect } from '@playwright/test'
import { signUpAndLogIn, uniqueEmail } from './helpers'

// QUIZ-SESSION-LIVE-STATUS-001: the placeholder page a student reaches
// via the trainer's QR/URL — joins on load with no sign-in of any kind,
// and the trainer's own monitor page picks up the join/submit via
// polling. Two separate browser contexts (trainer + anonymous student),
// since the whole point is that the student has no session at all.

const VALID_QTI_ITEM = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="q1" title="Sample question">
  <qti-item-body><p>What is 2 + 2?</p></qti-item-body>
</qti-assessment-item>`

test('a student joining and submitting via the placeholder page shows up on the trainer\'s monitor', async ({ page, browser }) => {
  await signUpAndLogIn(page, uniqueEmail('e2e-take'), 'correct-horse-1')

  await page.getByRole('button', { name: /new course/i }).click()
  await page.getByLabel('Course name').fill('E2E Take Course')
  await page.getByRole('button', { name: /^create$/i }).click()
  await page.getByText('E2E Take Course').click()

  await page.locator('input[data-testid="upload-file-input"]').setInputFiles({
    name: 'quiz.xml',
    mimeType: 'text/xml',
    buffer: Buffer.from(VALID_QTI_ITEM),
  })
  await page.getByRole('button', { name: /create session/i }).click()
  await expect(page).toHaveURL(/\/quiz-sessions\/[^/]+$/)

  const takeUrl = await page.locator('p').filter({ hasText: /\/take$/ }).innerText()
  await expect(page.getByTestId('block-2-live-status')).toContainText('0 joined')

  // an anonymous student, in a separate browser context (no cookies
  // shared with the trainer's session at all)
  const studentContext = await browser.newContext()
  const studentPage = await studentContext.newPage()
  await studentPage.goto(takeUrl)
  await expect(studentPage.getByTestId('joined-placeholder')).toBeVisible()

  await expect(page.getByTestId('block-2-live-status')).toContainText('1 joined', { timeout: 10_000 })

  await studentPage.getByRole('button', { name: /submit/i }).click()
  await expect(studentPage.getByText(/submitted — thanks/i)).toBeVisible()

  // start the session so Block #2 shows the answers progress (the
  // "N joined" pre-start line doesn't show a submitted count)
  await page.getByRole('button', { name: /^start$/i }).click()
  await expect(page.getByTestId('block-2-live-status')).toContainText('1/1 answered', { timeout: 10_000 })

  await studentContext.close()
})
