import sax from 'sax'

export interface QtiValidationError {
  line: number
  message: string
}

export interface QtiValidationResult {
  valid: boolean
  errors: QtiValidationError[]
  // Present only when valid — the root element's declared title, used as
  // the quiz's title (QTI-22-IMPORT DoD doesn't specify where the title
  // comes from; the file's own `title` attribute is the natural source,
  // since QTI 2.2 requires it).
  title?: string
}

const QTI_2P2_NAMESPACE = 'http://www.imsglobal.org/xsd/imsqti_v2p2'
const ROOT_ELEMENT_NAMES = new Set(['assessmentItem', 'assessmentTest'])

/**
 * QTI-22-IMPORT: structural validation of an uploaded QTI 2.2 file,
 * reporting line/element-level errors per the DoD.
 *
 * This is NOT full XSD schema validation against the official QTI 2.2
 * schema (`imsqti_v2p2.xsd`) — that schema is a large, multi-file XSD
 * this environment has no network access to fetch, and hand-transcribing
 * it would itself be error-prone and unverifiable. Instead this checks
 * the structural rules a trainer's mistake would actually violate:
 * well-formed XML, the correct root element and namespace, the root's two
 * required attributes (`identifier`, `title`), and — for an
 * `assessmentItem` — at least one `itemBody`. Documented here and in
 * `story_upload_qti_22_quiz.md` as a known scope reduction, not hidden.
 */
export function validateQti22(fileContent: Buffer): QtiValidationResult {
  const errors: QtiValidationError[] = []
  const parser = sax.parser(true)

  let rootSeen = false
  let rootIsAssessmentItem = false
  let sawItemBody = false
  let title: string | undefined

  function localName(name: string): string {
    const colon = name.indexOf(':')
    return colon === -1 ? name : name.slice(colon + 1)
  }

  parser.onerror = (err) => {
    errors.push({ line: parser.line + 1, message: err.message.split('\n')[0] })
    parser.resume()
  }

  parser.onopentag = (node) => {
    const name = localName(node.name)

    if (!rootSeen) {
      rootSeen = true
      if (!ROOT_ELEMENT_NAMES.has(name)) {
        errors.push({
          line: parser.line + 1,
          message: `root element must be <assessmentItem> or <assessmentTest>, found <${name}>`,
        })
        return
      }
      rootIsAssessmentItem = name === 'assessmentItem'

      const xmlns = typeof node.attributes['xmlns'] === 'string' ? node.attributes['xmlns'] : undefined
      if (xmlns !== undefined && xmlns !== QTI_2P2_NAMESPACE) {
        errors.push({
          line: parser.line + 1,
          message: `<${name}> has namespace "${xmlns}", expected "${QTI_2P2_NAMESPACE}" (QTI 2.2)`,
        })
      }

      const identifier = node.attributes['identifier']
      if (typeof identifier !== 'string' || identifier.trim().length === 0) {
        errors.push({ line: parser.line + 1, message: `<${name}> is missing the required "identifier" attribute` })
      }

      const titleAttr = node.attributes['title']
      if (typeof titleAttr !== 'string' || titleAttr.trim().length === 0) {
        errors.push({ line: parser.line + 1, message: `<${name}> is missing the required "title" attribute` })
      } else {
        title = titleAttr
      }
    }

    if (name === 'itemBody') sawItemBody = true
  }

  try {
    parser.write(fileContent.toString('utf-8')).close()
  } catch {
    // sax can still throw past onerror/resume() for unrecoverable states —
    // the errors array already has what was collected before that point.
  }

  if (!rootSeen) {
    errors.push({ line: 1, message: 'the file has no root element (is it empty?)' })
  } else if (rootIsAssessmentItem && !sawItemBody) {
    errors.push({ line: 1, message: '<assessmentItem> is missing the required <itemBody> element' })
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }
  return { valid: true, errors: [], title }
}
