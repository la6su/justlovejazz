// src/app/index.ts — Phase 5: the Vue Router mount and navigation owner.
//
// Candidate path: `VITE_JLZ_VUE_ROUTER=1` selects this entry over the
// legacy DOM router in `src/router.ts`. Until the candidate gate passes and the Phase 5 cleanup
// commit lands, the production default stays the legacy router and the
// entry branch stays inactive.
//
// The navigation surface is a 1:1 port of the legacy router's contracts:
// strict in-app navigation (unknown link = no-op), lenient direct entry
// (unknown path → home, URL untouched), the `jlz:navigate` event, the
// anchor click capture handler (incl. bare-hash and `data-nav-href`
// skips), the `jlz:lang-change` re-apply, the section-hash dispatch after
// the 3D navigation owner is ready, and the route announcer (owned by
// `PageView`). `popstate` is handled by `createWebHistory` itself; the
// native `Experience` is never touched by navigation.

import { createSSRApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { applyTranslations } from '../core/i18n'
import { applyMetaTags } from '../core/pageMeta'
import { isRoutePath, resolveRoute } from '../core/routeManifest'
import AppShell from './AppShell.vue'
import { jlzRouteRecords, pageForPath } from './routes'

let mounted = false

/** Mount the public Vue application on `#app` and take over navigation. */
export async function mountVueApp(): Promise<void> {
  if (mounted) return
  mounted = true

  const root = document.getElementById('app')
  if (!root) throw new Error('Missing app element #app')

  const router = createRouter({
    history: createWebHistory(),
    routes: jlzRouteRecords(),
  })

  // ── Section-hash dispatch (legacy router contract) ─────────────────────
  // After navigation settles, a `#section-*` hash must reach the 3D
  // navigation owner (CinematicNav). The initial entry is deferred until
  // `jlz:webgl-ready` — dispatching earlier races the owner's subscription
  // and leaves the world with stale first-frame state (legacy comment).
  // Track the very first navigation (regardless of hash): only a direct
  // load that already carries a `#section-` hash defers the dispatch until
  // the 3D navigation owner is ready. In-app hash navigations dispatch on
  // the next frame, matching the legacy `navigateToPage` contract.
  let firstNavigation = true
  router.afterEach((to) => {
    const isInitial = firstNavigation
    firstNavigation = false
    if (!to.hash.startsWith('#section-')) return
    if (isInitial) {
      window.addEventListener(
        'jlz:webgl-ready',
        () => {
          window.dispatchEvent(
            new CustomEvent('jlz:goto-section-by-hash', { detail: { hash: to.hash } }),
          )
        },
        { once: true },
      )
      return
    }
    requestAnimationFrame(() => {
      window.dispatchEvent(
        new CustomEvent('jlz:goto-section-by-hash', { detail: { hash: to.hash } }),
      )
    })
  })

  // createSSRApp: when the build-time prerender (vite `prerender-index`)
  // left the home route shell in `#app`, mount hydrates it instead of
  // replacing it; with an empty `#app` the behavior is identical to a
  // fresh mount.
  const app = createSSRApp(AppShell)
  app.use(router)
  app.mount(root)
  await router.isReady()

  // ── In-app navigation (strict, like the legacy `navigateToPage`) ───────
  const navigateToPath = async (path: string): Promise<void> => {
    const hashIdx = path.indexOf('#')
    const purePath = hashIdx >= 0 ? path.slice(0, hashIdx) : path
    if (!resolveRoute(purePath)) return
    await router.push(path)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  // jlz:navigate — navigation REQUEST from menu subsection clicks (strict).
  window.addEventListener('jlz:navigate', ((event: Event) => {
    const detail = (event as CustomEvent<{ path: string }>).detail
    if (detail?.path) void navigateToPath(detail.path)
  }) as EventListener)

  // jlz:lang-change — re-apply translations + per-page meta to the live DOM.
  window.addEventListener('jlz:lang-change', () => {
    applyTranslations()
    applyMetaTags(pageForPath(router.currentRoute.value.path))
  })

  // Anchor click capture — port of the legacy document capture handler.
  const onClick = (event: MouseEvent): void => {
    const anchorEl = (event.target as HTMLElement)?.closest('a[href]') as HTMLAnchorElement | null
    if (!anchorEl) return
    const href = anchorEl.getAttribute('href')
    if (!href) return
    // Skip data-nav-href anchors — the nav sub-link listener handles them
    // and dispatches jlz:navigate with the hash preserved.
    if (anchorEl.dataset.navHref !== undefined) return
    // A bare hash is a UIkit toggle / local control, not a route.
    if (href.startsWith('#')) {
      event.preventDefault()
      if (href === '#') return
      const target = document.getElementById(href.slice(1))
      if (target) {
        history.pushState(null, '', href)
        target.scrollIntoView({ behavior: 'smooth' })
      }
      return
    }
    const url = new URL(href, window.location.origin)
    if (url.origin === window.location.origin && isRoutePath(url.pathname)) {
      event.preventDefault()
      void navigateToPath(url.pathname + url.hash)
    }
  }
  document.addEventListener('click', onClick, true)
}
