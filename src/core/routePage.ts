// src/core/routePage.ts — Phase 3 typed route-page port (legacy adapter).
//
// The single place that reads the current route page from the DOM. Scene code
// must call `getCurrentPage()` instead of touching `document.body.dataset`
// (docs/ARCHITECTURE.md: "Scene code does not query
// `document.body.dataset`... Typed readonly ports carry route, locale,
// effective theme, reduced-motion and story progress into the scene.").
//
// Legacy adapter by design: today the router still writes the page into
// `document.body.dataset.page` (CSS scoping and legacy consumers depend on
// it until Phase 5). When Phase 5's Vue Router provides the page as typed
// state, this module's implementation switches to that source and every
// scene consumer stays unchanged — the port is the seam.
//
// Read semantics are deliberately pull-based: consumers read the page at the
// same moment they did when they read the dataset, so the migration changes
// the source of the fact without changing any timing.
//
// Pure of scene imports: no Three, no DOM writes, no globals beyond the read
// itself — unit-testable under jsdom.
//
// Namespace note: the dataset carries a *PageId* (`'services'`), not a route
// *path* (`'/services'`). The port therefore validates against the manifest's
// page set (`MANIFEST_PAGES`) — the strict path resolvers in
// `routeManifest.ts` operate on a different namespace and must not be used
// here.

import type { PageId } from '../sections/_shared/constants'
import { MANIFEST_PAGES } from './routeManifest'

const PAGE_IDS: ReadonlySet<string> = new Set<string>(MANIFEST_PAGES)

/**
 * The current route page.
 *
 * - reads `document.body.dataset.page` (the router's single writer);
 * - normalizes a qualified value to its first segment (matches the former
 *   defensive `split('-')[0]` read in `World.init`);
 * - falls back to `home` for a missing attribute or a value that is not a
 *   manifest page (the same default the router resolves unknown input to).
 */
export function getCurrentPage(): PageId {
  const raw = document.body?.getAttribute('data-page')
  if (!raw) return 'home'
  const segment = raw.split('-')[0] ?? ''
  return PAGE_IDS.has(segment) ? (segment as PageId) : 'home'
}

/** Convenience predicate: `true` when the current page is `page`. */
export function isCurrentPage(page: PageId): boolean {
  return getCurrentPage() === page
}
