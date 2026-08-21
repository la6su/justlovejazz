// src/app/index.ts — Phase 5: the Vue Router mount and navigation owner.
//
// `src/entry-app.ts` mounts this app via a dynamic import (the only edge
// into the Vue graph), so the router + route SFCs stay in a separate lazy
// `app` chunk. The legacy DOM router and the string page/section templates
// were removed in the Phase 5 cleanup commit.
//
// The navigation surface is a 1:1 port of the legacy router's contracts:
// strict in-app navigation (unknown link = no-op), lenient direct entry
// (unknown path → home, URL untouched), the `jlz:navigate` event, the
// anchor click capture handler (incl. bare-hash and `data-nav-href`
// skips), the `jlz:lang-change` re-apply, the section-hash dispatch after
// the 3D navigation owner is ready, and the route announcer (owned by
// `useJlzPage`). `popstate` is handled by `createWebHistory` itself; the
// native `Experience` is never touched by navigation.

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { applyTranslations } from '../core/i18n'
import { applyMetaTags } from '../core/pageMeta'
import { isRoutePath, resolveRoute } from '../core/routeManifest'
import { RouteTransition } from '../UI/RouteTransition'
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

  // ── Route transition (legacy `routeTransition.run(render)` contract) ───
  // The cover phase completes inside the navigation guard, so the RouterView
  // re-render lands under the covered document; the reveal starts once the
  // route has settled. Under reduced motion both phases are synchronous
  // no-ops and the overlay element is never created (RouteTransition).
  const routeTransition = new RouteTransition()
  // The initial navigation skips the cover: the legacy `initRouter`
  // rendered the first page without the transition (no prior document to
  // cover), and a synchronous first commit leaves no startup gap in which
  // an early `jlz:navigate` could race the router.
  let coverNavigation = true
  router.beforeEach(async () => {
    if (coverNavigation) {
      coverNavigation = false
      return
    }
    await routeTransition.cover()
  })
  router.afterEach(() => {
    routeTransition.reveal()
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

  const app = createApp(AppShell)
  // Resolve the initial navigation BEFORE the mount so RouterView renders
  // the landing component on its first pass. `router.install` starts the
  // initial navigation; the ready promise also gates in-app navigation
  // (below) against the startup gap.
  app.use(router)
  const routerReady = router.isReady()

  // ── In-app navigation (strict, like the legacy `navigateToPage`) ───────
  // The listeners register BEFORE the initial navigation settles: the
  // legacy initRouter wired them synchronously at startup, and an early
  // `jlz:navigate` (or anchor click) in the startup gap must not be lost.
  const navigateToPath = async (path: string): Promise<void> => {
    const hashIdx = path.indexOf('#')
    const purePath = hashIdx >= 0 ? path.slice(0, hashIdx) : path
    if (!resolveRoute(purePath)) return
    // A push before the initial navigation settles is committed against
    // the start history entry (replace) and loses the session's first
    // back slot — the legacy contract never had this window because its
    // first render and listener wiring landed in one synchronous call.
    await routerReady
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

  await routerReady
  // A fresh client render (createApp) replaces `#app`'s content on mount:
  // the build-time prerender (vite `prerender-index`) keeps the home route
  // shell available before JS boots (SEO, the no-scene contract, the
  // domcontentloaded e2e assertions), and the SFC re-renders the identical
  // DOM (locked by the parity suite) — a deliberate replace, not a
  // hydration: the prerendered HTML is not a clean hydration target for
  // Vue's condensed client render.
  app.mount(root)
}
