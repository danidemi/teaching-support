import { describe, it, expect } from 'vitest'
import { validateQti3 } from './validateQti3.js'

// Covers QTI3-MIGRATION-001's DoD (active_sprint/story_qti3_migration.md):
// validates QTI 3.0 files with the same structural-check shape
// `validateQti22` used, plus rejecting a QTI 2.2 file post-cutover.

const VALID_ITEM = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="q1" title="Sample question">
  <qti-item-body>
    <p>What is 2 + 2?</p>
  </qti-item-body>
</qti-assessment-item>`

function buf(xml: string) {
  return Buffer.from(xml, 'utf-8')
}

describe('validateQti3 (QTI3-MIGRATION-001)', () => {
  it('accepts a well-formed, minimally-complete qti-assessment-item', () => {
    // given: a valid QTI 3.0 assessment item
    const result = validateQti3(buf(VALID_ITEM))

    // then: it is accepted, and the declared title is extracted
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.title).toBe('Sample question')
  })

  it('rejects malformed XML with a line number', () => {
    // given: XML with a mismatched closing tag
    const result = validateQti3(buf('<qti-assessment-item>\n<qti-item-body>\n</qti-assessment-item>'))

    // then: it is rejected, with an error pointing at a specific line
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].line).toBeGreaterThan(0)
  })

  it('rejects a document with the wrong root element', () => {
    // given: an XML file that isn't a QTI item or test at all
    const result = validateQti3(buf('<somethingElse identifier="x" title="y"/>'))

    // then: it is rejected, naming the actual root element found
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('somethingElse'))).toBe(true)
  })

  it('rejects a QTI 2.2 file as wrong root element, now that QTI 2.2 is unsupported', () => {
    // given: a well-formed, previously-valid QTI 2.2 assessmentItem
    const result = validateQti3(
      buf(
        '<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2" identifier="q1" title="Old format"><itemBody/></assessmentItem>',
      ),
    )

    // then: it is rejected the same way any other wrong-root file is (ADR-0007 hard cutover)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('assessmentItem'))).toBe(true)
  })

  it('rejects a qti-assessment-item missing the required "identifier" attribute', () => {
    const result = validateQti3(
      buf('<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" title="No id"><qti-item-body/></qti-assessment-item>'),
    )

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('identifier'))).toBe(true)
  })

  it('rejects a qti-assessment-item missing the required "title" attribute', () => {
    const result = validateQti3(
      buf('<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="q1"><qti-item-body/></qti-assessment-item>'),
    )

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('title'))).toBe(true)
  })

  it('rejects a qti-assessment-item missing the required qti-item-body element', () => {
    const result = validateQti3(
      buf('<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="q1" title="No body"/>'),
    )

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('qti-item-body'))).toBe(true)
  })

  it('rejects a root element in the wrong namespace', () => {
    const result = validateQti3(
      buf('<qti-assessment-item xmlns="http://example.com/not-qti" identifier="q1" title="Wrong ns"><qti-item-body/></qti-assessment-item>'),
    )

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('namespace'))).toBe(true)
  })

  it('rejects an empty file', () => {
    const result = validateQti3(buf(''))

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('no root element'))).toBe(true)
  })

  it('accepts a qti-assessment-test root without requiring qti-item-body', () => {
    const result = validateQti3(
      buf('<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="t1" title="A test"/>'),
    )

    expect(result.valid).toBe(true)
  })

  it('collects multiple errors at once rather than stopping at the first', () => {
    // given: missing both identifier and title
    const result = validateQti3(buf('<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body/></qti-assessment-item>'))

    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })
})
