import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import AdmZip from 'adm-zip'

// QUIZ-PACKAGE-STORAGE-001: single source of truth for the "valid multi-item
// QTI package" fixture, assembled from the loose QTI-UAT-SAMPLES-001 files
// rather than a `.zip` committed to git. Shared by validateQti3.test.ts,
// quizzes.test.ts, and scripts/build-qti-package-fixture.ts (the manual-UAT
// CLI wrapper) so all three agree on what "the valid package fixture" is.

const SAMPLES_DIR = path.dirname(fileURLToPath(import.meta.url))

function readSample(name: string): Buffer {
  return readFileSync(path.join(SAMPLES_DIR, name))
}

export const PACKAGE_MANIFEST = '<?xml version="1.0" encoding="UTF-8"?><manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"/>'

export function validPackageEntries(): Record<string, Buffer> {
  return {
    'imsmanifest.xml': Buffer.from(PACKAGE_MANIFEST, 'utf-8'),
    'test.xml': readSample('sample-accept-multi-item-test.xml'),
    'sample-accept-single-choice-basic.xml': readSample('sample-accept-single-choice-basic.xml'),
    'sample-accept-multiple-choice-basic.xml': readSample('sample-accept-multiple-choice-basic.xml'),
  }
}

export function zipOf(entries: Record<string, Buffer | string>): Buffer {
  const zip = new AdmZip()
  for (const [entryName, content] of Object.entries(entries)) {
    zip.addFile(entryName, Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8'))
  }
  return zip.toBuffer()
}

export function validPackageZip(): Buffer {
  return zipOf(validPackageEntries())
}
