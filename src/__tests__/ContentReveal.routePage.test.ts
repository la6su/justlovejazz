import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ContentReveal } from '../Experience/ContentReveal'
import { eventBus } from '../core/EventBus'
import type { PageId } from '../sections/_shared/constants'

describe('ContentReveal typed page port', () => {
  let reveal: ContentReveal
  let page: PageId

  beforeEach(() => {
    page = 'home'
    document.body.innerHTML = '<section data-section="intro" class="section-active"></section>'
    document.body.dataset.page = 'works'
    reveal = new ContentReveal(() => page)
  })

  afterEach(() => {
    reveal.destroy()
    document.body.replaceChildren()
    delete document.body.dataset.page
  })

  it('uses the injected page getter instead of the legacy DOM dataset', () => {
    const configs = (
      reveal as unknown as { getConfigs: () => readonly { id: string }[] }
    ).getConfigs()

    expect(configs[0]?.id).toBe('sec_lab')
  })

  it('invalidates the cached config when the route changes', () => {
    const getConfigs = () =>
      (reveal as unknown as { getConfigs: () => readonly { id: string }[] }).getConfigs()
    expect(getConfigs()[0]?.id).toBe('sec_lab')

    page = 'works'
    eventBus.emit('jlz:route-change', { page: 'works' })

    expect(getConfigs()[0]?.id).toBe('content_works_0')
  })
})
