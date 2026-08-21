// src/__tests__/vueAppRouter.test.ts — Phase 5 Vue Router candidate slice.
//
// Two layers: the pure route records (bijection with the Phase 3 route
// manifest, one semantic route SFC per record) and the `AppShell` mount
// (a real memory-history router over jsdom: the home SFC renders into
// `#spa-content`, `jlz:route-change` is emitted, and an in-app push
// re-renders the target page with its meta applied). The imperative side
// effects are mocked — the SFCs' DOM contract is covered by the
// SFC/string-template parity suite and the live candidate gate.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

vi.mock('uikit', () => ({
  default: { update: vi.fn() },
}))
vi.mock('../core/i18n', () => ({
  applyTranslations: vi.fn(),
}))
vi.mock('../core/pageMeta', () => ({
  applyMetaTags: vi.fn(),
}))
vi.mock('../UI/WorkCards', () => ({
  disposeWorkCards: vi.fn(),
  initWorkCards: vi.fn(),
}))
vi.mock('../sections/nav/template', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../sections/nav/template')>()
  return { ...actual, initMenuToolbar: vi.fn() }
})
// Reduced-motion: the route transition renders synchronously, so the tests
// stay deterministic without waiting out the overlay animation.
vi.mock('../core/motionPolicy', () => ({
  prefersReducedMotion: () => true,
}))

import AppShell from '../app/AppShell.vue'
import { pageForPath, jlzRouteRecords } from '../app/routes'
import HomeView from '../app/views/HomeView.vue'
import { ROUTE_MANIFEST, resolvePage } from '../core/routeManifest'
import { eventBus } from '../core/EventBus'
import { applyTranslations } from '../core/i18n'
import { applyMetaTags } from '../core/pageMeta'
import type { PageId } from '../sections/_shared/constants'

const setupAnnouncer = (): void => {
  if (!document.getElementById('jlz-route-announcer')) {
    const announcer = document.createElement('div')
    announcer.id = 'jlz-route-announcer'
    announcer.className = 'uk-hidden-visually'
    announcer.setAttribute('aria-live', 'polite')
    document.body.appendChild(announcer)
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('jlzRouteRecords', () => {
  it('derives one record per manifest entry plus the catch-all fallback', () => {
    const records = jlzRouteRecords()
    expect(records).toHaveLength(ROUTE_MANIFEST.length + 1)
    for (const entry of ROUTE_MANIFEST) {
      const record = records.find((r) => r.path === entry.path)
      expect(record?.name).toBe(entry.page)
      // The semantic route SFC is the route target (PageView is no longer
      // a route component).
      expect(typeof record?.component).toBe('object')
    }
    expect(records[0]?.component).toBe(HomeView)
    const fallback = records[records.length - 1]
    expect(fallback?.path).toBe('/:pathMatch(.*)*')
    expect(fallback?.component).toBe(HomeView)
  })

  it('pageForPath is the lenient manifest resolution (unknown → home)', () => {
    for (const entry of ROUTE_MANIFEST) {
      expect(pageForPath(entry.path)).toBe(entry.page)
    }
    expect(pageForPath('/stale-deep-link')).toBe('home')
    expect(pageForPath('/stale-deep-link')).toBe(resolvePage('/stale-deep-link'))
  })
})

describe('AppShell + route SFCs', () => {
  const mountShell = async (start = '/'): Promise<void> => {
    setupAnnouncer()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: jlzRouteRecords(),
    })
    const wrapper = mount(AppShell, { attachTo: document.body, global: { plugins: [router] } })
    // Seed the direct-entry location: the install-triggered initial
    // navigation resolves against the memory history's '/', so the target
    // push settles it as the first completed navigation.
    await router.push(start)
    await router.isReady()
    await flushPromises()
    // Keep the router reachable for the navigation assertions.
    ;(window as unknown as { __testRouter?: typeof router }).__testRouter = router
    wrapper.unmount.bind(wrapper)
  }

  it('renders the home page into #spa-content and emits jlz:route-change', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit')
    await mountShell('/')
    const content = document.getElementById('spa-content')
    expect(content?.getAttribute('role')).toBe('main')
    // innerHTML round-trips through the parser — compare the rendered
    // section markers instead of the raw template string.
    expect(
      content?.querySelector('[data-section="intro"]')?.classList.contains('section-active'),
    ).toBe(true)
    expect(content?.innerHTML).toContain('data-section="intro"')
    expect(content?.innerHTML).toContain('data-section="works"')
    expect(emitSpy).toHaveBeenCalledWith(
      'jlz:route-change',
      expect.objectContaining({ page: 'home' }),
    )
    expect(applyMetaTags).toHaveBeenCalledWith('home')
    expect(applyTranslations).toHaveBeenCalled()
  })

  it('renders the lenient fallback for an unknown direct entry (URL untouched)', async () => {
    await mountShell('/stale-deep-link')
    const content = document.getElementById('spa-content')
    expect(content?.innerHTML).toContain('data-section="intro"')
    const router = (window as unknown as { __testRouter: ReturnType<typeof createRouter> })
      .__testRouter
    expect(router.currentRoute.value.path).toBe('/stale-deep-link')
  })

  it('re-renders on an in-app push and applies the target page meta', async () => {
    await mountShell('/')
    const router = (window as unknown as { __testRouter: ReturnType<typeof createRouter> })
      .__testRouter
    await router.push('/works')
    await flushPromises()
    const content = document.getElementById('spa-content')
    expect(content?.innerHTML).toContain('data-page-section')
    expect(applyMetaTags).toHaveBeenCalledWith('works')
    expect(applyMetaTags).toHaveBeenLastCalledWith('works' as PageId)
  })
})
