import sax from 'sax'

export interface QtiValidationError {
  line: number
  message: string
}

export interface QtiValidationResult {
  valid: boolean
  errors: QtiValidationError[]
  // Present only when valid — the root element's declared title, used as
  // the quiz's title (QTI-22-IMPORT's DoD, carried over unchanged by
  // QTI3-MIGRATION-001 — the file's own `title` attribute is the natural
  // source, since QTI 3.0 requires it too).
  title?: string
}

const QTI_3P0_NAMESPACE = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0'
const ROOT_ELEMENT_NAMES = new Set(['qti-assessment-item', 'qti-assessment-test'])

/**
 * QTI3-MIGRATION-001: structural validation of an uploaded QTI 3.0 file,
 * reporting line/element-level errors per the DoD.
 *
 * This replaces `validateQti22` (removed — ADR-0007's hard cutover, no
 * dual-format support). Same scope reduction as that module: NOT full XSD
 * schema validation against the official QTI 3.0 schema — this checks the
 * structural rules a trainer's mistake would actually violate: well-formed
 * XML, the correct root element and namespace, the root's two required
 * attributes (`identifier`, `title`), and — for a `qti-assessment-item` —
 * at least one `qti-item-body` (QTI 3.0's renamed `itemBody`).
 */
export function validateQti3(fileContent: Buffer): QtiValidationResult {
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
          message: `root element must be <qti-assessment-item> or <qti-assessment-test>, found <${name}>`,
        })
        return
      }
      rootIsAssessmentItem = name === 'qti-assessment-item'

      const xmlns = typeof node.attributes['xmlns'] === 'string' ? node.attributes['xmlns'] : undefined
      if (xmlns !== undefined && xmlns !== QTI_3P0_NAMESPACE) {
        errors.push({
          line: parser.line + 1,
          message: `<${name}> has namespace "${xmlns}", expected "${QTI_3P0_NAMESPACE}" (QTI 3.0)`,
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

    if (name === 'qti-item-body') sawItemBody = true
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
    errors.push({ line: 1, message: '<qti-assessment-item> is missing the required <qti-item-body> element' })
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }
  return { valid: true, errors: [], title }
}
