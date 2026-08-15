import { describe, expect, it } from 'vitest'

import {
  generateBuilderComponentLess,
  generateBuilderThemeLess,
  getBuilderUIKitComponents,
} from '../builder/compiler'
import { DEFAULT_BUILDER_DOCUMENT } from '../builder/default-document'
import { renderBuilderDocument } from '../builder/render'
import { validateBuilderDocument } from '../builder/schema'
import { renderStyleShowcase } from '../builder/style-showcase'

describe('Page Builder document', () => {
  it('accepts the checked-in generated document shape', () => {
    const result = validateBuilderDocument(DEFAULT_BUILDER_DOCUMENT)
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects Less injection in theme values', () => {
    const document = structuredClone(DEFAULT_BUILDER_DOCUMENT)
    document.theme.accent = '#fff; @import "evil.less"'

    const result = validateBuilderDocument(document)
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('theme.accent must be a six-digit hex color')
  })

  it('rejects unsupported component style values', () => {
    const document = structuredClone(DEFAULT_BUILDER_DOCUMENT)
    document.theme.cardShadow = 'url(https://example.com/evil.css)'

    const result = validateBuilderDocument(document)
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('theme.cardShadow has an unsupported value')
  })

  it('escapes copy and refuses unsafe links in rendered output', () => {
    const document = structuredClone(DEFAULT_BUILDER_DOCUMENT)
    const card = document.nodes[0]?.children[0]?.children[0]
    const heading = card?.children[0]
    const button = card?.children[2]
    if (!heading || !button) throw new Error('default builder fixture changed')
    heading.props.content = '<img src=x onerror=alert(1)>'
    button.props.href = 'javascript:alert(1)'

    const html = renderBuilderDocument(document)
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('href="#"')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('javascript:')
  })

  it('emits only optional UIkit components missing from the app baseline', () => {
    expect(getBuilderUIKitComponents(DEFAULT_BUILDER_DOCUMENT)).toContain('card')
    const less = generateBuilderComponentLess(DEFAULT_BUILDER_DOCUMENT)
    expect(less).toContain('/card.less')
    expect(less).not.toContain('/grid.less')
    expect(less).not.toContain('/button.less')
  })

  it('compiles global, inverse and component decisions into whitelisted Less', () => {
    const less = generateBuilderThemeLess(DEFAULT_BUILDER_DOCUMENT)
    expect(less).toContain('@jlz-inverse-bg: #efe0cc;')
    expect(less).toContain('@button-line-height: 44px;')
    expect(less).toContain('@card-body-padding-horizontal: 32px;')
    expect(less).not.toContain('undefined')
  })

  it('renders a complete or focused style showcase', () => {
    const complete = renderStyleShowcase('button', true)
    const focused = renderStyleShowcase('button', false)

    expect(complete).toContain('data-style-sample="global"')
    expect(complete).toContain('data-style-sample="navbar"')
    expect(focused).toContain('data-style-sample="button"')
    expect(focused).not.toContain('data-style-sample="card"')
  })
})
