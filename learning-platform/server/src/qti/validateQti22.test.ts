import { describe, it, expect } from 'vitest'
import { validateQti22 } from './validateQti22.js'

// Covers QTI-22-IMPORT's DoD (active_sprint/story_upload_qti_22_quiz.md):
// "the quiz is checked for format and an error is reported if the format
// is not correct" — reporting line/element-level errors. This is
// structural validation (root element, required attributes, itemBody),
// not full XSD validation — see the module's own doc comment for why.

const VALID_ITEM = `<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2" identifier="q1" title="Sample question">
  <itemBody>
    <p>What is 2 + 2?</p>
  </itemBody>
</assessmentItem>`

function buf(xml: string) {
  return Buffer.from(xml, 'utf-8')
}

describe('validateQti22 (QTI-22-IMPORT)', () => {
  it('accepts a well-formed, minimally-complete assessmentItem', () => {
    // given: a valid QTI 2.2 assessmentItem
    const result = validateQti22(buf(VALID_ITEM))

    // then: it is accepted, and the declared title is extracted
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.title).toBe('Sample question')
  })

  it('rejects malformed XML with a line number', () => {
    // given: XML with a mismatched closing tag
    const result = validateQti22(buf('<assessmentItem>\n<itemBody>\n</assessmentItem>'))

    // then: it is rejected, with an error pointing at a specific line
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].line).toBeGreaterThan(0)
  })

  it('rejects a document with the wrong root element', () => {
    // given: an XML file that isn't a QTI item or test at all
    const result = validateQti22(buf('<somethingElse identifier="x" title="y"/>'))

    // then: it is rejected, naming the actual root element found
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('somethingElse'))).toBe(true)
  })

  it('rejects an assessmentItem missing the required "identifier" attribute', () => {
    const result = validateQti22(
      buf('<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2" title="No id"><itemBody/></assessmentItem>'),
    )

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('identifier'))).toBe(true)
  })

  it('rejects an assessmentItem missing the required "title" attribute', () => {
    const result = validateQti22(
      buf('<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2" identifier="q1"><itemBody/></assessmentItem>'),
    )

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('title'))).toBe(true)
  })

  it('rejects an assessmentItem missing the required itemBody element', () => {
    const result = validateQti22(buf('<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2" identifier="q1" title="No body"/>'))

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('itemBody'))).toBe(true)
  })

  it('rejects a root element in the wrong namespace', () => {
    const result = validateQti22(
      buf('<assessmentItem xmlns="http://example.com/not-qti" identifier="q1" title="Wrong ns"><itemBody/></assessmentItem>'),
    )

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('namespace'))).toBe(true)
  })

  it('rejects an empty file', () => {
    const result = validateQti22(buf(''))

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('no root element'))).toBe(true)
  })

  it('accepts an assessmentTest root without requiring itemBody', () => {
    const result = validateQti22(
      buf('<assessmentTest xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2" identifier="t1" title="A test"/>'),
    )

    expect(result.valid).toBe(true)
  })

  it('collects multiple errors at once rather than stopping at the first', () => {
    // given: missing both identifier and title
    const result = validateQti22(buf('<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2"><itemBody/></assessmentItem>'))

    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })
})
