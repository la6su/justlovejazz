import { describe, expect, it } from 'vitest'
import { sectionShell, homeTop, contentTop, i18nDesc, serviceExplore, descBlock, storyBottom, contentBottom } from '../sections/_shared/constants'
import type { PageId } from '../sections/_shared/constants'

describe('sectionShell', () => {
  it('wraps content in a section with correct id', () => {
    const html = sectionShell('intro', '<p>top</p>', '<p>bottom</p>', 'home')
    expect(html).toContain('id="section-intro"')
    expect(html).toContain('data-section="intro"')
    expect(html).toContain('<p>top</p>')
    expect(html).toContain('<p>bottom</p>')
  })

  it('adds content-page attributes in content mode', () => {
    const html = sectionShell('test-1', '', '', 'content')
    expect(html).toContain('data-page-section="test-1"')
    expect(html).toContain('jlz-page-section')
  })

  it('adds section-active only for content mode with isActive=true', () => {
    const active = sectionShell('a', '', '', 'content', true)
    expect(active).toContain('section-active')

    const inactive = sectionShell('a', '', '', 'content', false)
    expect(inactive).not.toContain('section-active')

    const homeActive = sectionShell('a', '', '', 'home', true)
    expect(homeActive).not.toContain('section-active')
  })

  it('includes extraAttrs and extraHtml when provided', () => {
    const html = sectionShell('x', '', '', 'home', false, 'data-cinematic-menu', '<div>extra</div>')
    expect(html).toContain('data-cinematic-menu')
    expect(html).toContain('<div>extra</div>')
  })
})

describe('homeTop', () => {
  it('generates eyebrow, title with i18n, and lead', () => {
    const html = homeTop('01', 'home.intro.title', 'Studio', 'home.intro.lead', 'Creative development.')
    expect(html).toContain('data-eyebrow')
    expect(html).toContain('data-eyebrow-text="01"')
    expect(html).toContain('data-i18n="home.intro.title"')
    expect(html).toContain('data-i18n="home.intro.lead"')
    expect(html).toContain('>Studio<')
    expect(html).toContain('>Creative development.<')
  })

  it('supports xlarge tier', () => {
    const html = homeTop('01', 'key', 'Title', 'leadKey', 'Lead', 'xlarge')
    expect(html).toContain('uk-heading-xlarge')
  })
})

describe('contentTop', () => {
  it('includes title without i18n when key is omitted', () => {
    const html = contentTop('01', 'Title', 'Lead')
    expect(html).toContain('>Title<')
    expect(html).not.toContain('data-i18n="')
  })

  it('includes i18n attributes when keys are provided', () => {
    const html = contentTop('01', 'Title', 'Lead', 'medium', 'titleKey', 'leadKey')
    expect(html).toContain('data-i18n="titleKey"')
    expect(html).toContain('data-i18n="leadKey"')
  })

  it('omits lead paragraph when lead is undefined', () => {
    const html = contentTop('01', 'Title')
    expect(html).not.toContain('uk-text-lead')
  })
})

describe('i18nDesc', () => {
  it('generates desc lines with auto-numbered i18n keys', () => {
    const html = i18nDesc('my.key', ['Line one', 'Line two'])
    expect(html).toContain('data-i18n="my.key.desc1">Line one<')
    expect(html).toContain('data-i18n="my.key.desc2">Line two<')
    expect(html).toContain('jlz-service-desc')
  })

  it('returns empty string for empty lines array', () => {
    expect(i18nDesc('key', [])).toBe('')
  })
})

describe('serviceExplore', () => {
  it('generates an explore link with i18n label', () => {
    const html = serviceExplore('/blog/test', 'common.explore', 'Explore')
    expect(html).toContain('href="/blog/test"')
    expect(html).toContain('data-i18n="common.explore"')
    expect(html).toContain('>Explore<')
    expect(html).toContain('jlz-service-explore')
  })
})

describe('descBlock', () => {
  it('generates desc lines from key+text pairs', () => {
    const html = descBlock([{ key: 'a.b', text: 'Text' }])
    expect(html).toContain('data-i18n="a.b">Text<')
    expect(html).toContain('jlz-desc')
  })
})

describe('storyBottom / contentBottom', () => {
  it('wraps content in cinematic shell', () => {
    const html = storyBottom('<p>content</p>', '—')
    expect(html).toContain('jlz-section-bottom')
    expect(html).toContain('<p>content</p>')
    expect(html).toContain('aria-hidden="true">—<')
  })

  it('contentBottom delegates to storyBottom', () => {
    const a = contentBottom('x')
    const b = storyBottom('x')
    expect(a).toBe(b)
  })
})