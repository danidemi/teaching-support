import { describe, it, expect } from 'vitest'
import { computeAnswerBreakdown } from './answerBreakdown.js'

// Covers QUIZ-CLASS-REVIEW-001's DoD
// (active_sprint/story_quiz_class_review.md): the per-item distribution
// computation, independent of the route/persistence layer.

const CHOICE_ITEM = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="single-choice-basic" title="Capital of France" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>choice_b</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"><qti-default-value><qti-value>0</qti-value></qti-default-value></qti-outcome-declaration>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
      <qti-simple-choice identifier="choice_a">Berlin</qti-simple-choice>
      <qti-simple-choice identifier="choice_b">Paris</qti-simple-choice>
      <qti-simple-choice identifier="choice_c">Rome</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"/>
</qti-assessment-item>`

const TEXT_ITEM = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="text-entry-item" title="Capital of Italy">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response><qti-value>Rome</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-item-body>
    <qti-text-entry-interaction response-identifier="RESPONSE"/>
  </qti-item-body>
</qti-assessment-item>`

describe('computeAnswerBreakdown (QUIZ-CLASS-REVIEW-001)', () => {
  it('buckets a qti-choice-interaction item by every offered option, marking the correct one', () => {
    // given: three students, two picking the correct option
    const responses = [{ RESPONSE: 'choice_b' }, { RESPONSE: 'choice_a' }, { RESPONSE: 'choice_b' }]

    // when
    const result = computeAnswerBreakdown(CHOICE_ITEM, responses)

    // then: every offered option is present, correct one marked, unpicked option at 0
    expect(result.buckets).toEqual([
      { label: 'Berlin', count: 1, isCorrect: false },
      { label: 'Paris', count: 2, isCorrect: true },
      { label: 'Rome', count: 0, isCorrect: false },
    ])
    expect(result.noAnswerCount).toBe(0)
  })

  it('groups a non-choice item by exact raw text, with duplicates counted together', () => {
    // given: two identical answers and one distinct one
    const responses = [{ RESPONSE: 'Rome' }, { RESPONSE: 'Rome' }, { RESPONSE: 'Milan' }]

    // when
    const result = computeAnswerBreakdown(TEXT_ITEM, responses)

    // then: two distinct buckets, correct one marked, duplicate counted once with count 2
    expect(result.buckets).toEqual(
      expect.arrayContaining([
        { label: 'Rome', count: 2, isCorrect: true },
        { label: 'Milan', count: 1, isCorrect: false },
      ]),
    )
    expect(result.buckets).toHaveLength(2)
    expect(result.noAnswerCount).toBe(0)
  })

  it('counts a connection with no row for the item as a separate no-answer count, not a bucket', () => {
    // given: one real answer and one connection that never answered this item (undefined)
    const responses = [{ RESPONSE: 'choice_b' }, undefined]

    // when
    const result = computeAnswerBreakdown(CHOICE_ITEM, responses)

    // then: the no-answer connection is not folded into any bucket
    expect(result.noAnswerCount).toBe(1)
    expect(result.buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(1)
  })

  it('carries the question text through from the interaction-level qti-prompt (how real quiz items author it)', () => {
    const withPrompt = CHOICE_ITEM.replace(
      '<qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">',
      '<qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1"><qti-prompt>Which city is the capital of France?</qti-prompt>',
    )
    const result = computeAnswerBreakdown(withPrompt, [{ RESPONSE: 'choice_b' }])
    expect(result.prompt).toBe('Which city is the capital of France?')
  })
})
