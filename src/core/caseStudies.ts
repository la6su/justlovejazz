/** Client-facing case-study contract shared by routes and static publishing. */
export type CaseStudyStatus = 'draft' | 'review' | 'published'
export type CaseStudyDisclosure = 'client' | 'self-initiated' | 'experimental' | 'ai-assisted'

export interface CaseStudyProof {
  label: string
  value: string
  source: string
}

export interface CaseStudyMedia {
  src: string
  alt: string
  width: number
  height: number
  kind: 'image' | 'video'
  caption?: string
}

export interface CaseStudy {
  projectId: string
  status: CaseStudyStatus
  disclosure: CaseStudyDisclosure
  outcome: string
  context: string
  problem: string
  role: string
  constraints: string[]
  response: string
  stack: string[]
  result: string
  proof: CaseStudyProof[]
  media: CaseStudyMedia[]
  ctaLabel: string
}

export interface CaseStudyValidationResult {
  ok: boolean
  errors: string[]
}

/** Published entries require evidence and accessible, dimensioned media. */
export function validateCaseStudy(caseStudy: CaseStudy): CaseStudyValidationResult {
  const errors: string[] = []
  const required: Array<keyof CaseStudy> = [
    'projectId',
    'outcome',
    'context',
    'problem',
    'role',
    'response',
    'result',
    'ctaLabel',
  ]
  for (const field of required) {
    const value = caseStudy[field]
    if (typeof value !== 'string' || value.trim() === '') errors.push(`${field} is required`)
  }

  if (caseStudy.status === 'published') {
    if (caseStudy.proof.length === 0) errors.push('published case study needs proof')
    if (caseStudy.media.length === 0) errors.push('published case study needs media')
  }

  caseStudy.proof.forEach((proof, index) => {
    if (!proof.label.trim() || !proof.value.trim() || !proof.source.trim()) {
      errors.push(`proof[${index}] needs label, value and source`)
    }
  })
  caseStudy.media.forEach((media, index) => {
    if (!media.src.trim() || !media.alt.trim()) errors.push(`media[${index}] needs src and alt`)
    if (!Number.isFinite(media.width) || media.width <= 0)
      errors.push(`media[${index}] width must be positive`)
    if (!Number.isFinite(media.height) || media.height <= 0)
      errors.push(`media[${index}] height must be positive`)
  })
  return { ok: errors.length === 0, errors }
}
