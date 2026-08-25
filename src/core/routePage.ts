// src/core/routePage.ts — Phase 3 typed route-page port (legacy adapter).
//
// The single typed route-page port. Scene code must call `getCurrentPage()`;
// the DOM dataset is only a compatibility projection for CSS/legacy consumers.
// (docs/ARCHITECTURE.md: "Scene code does not query
// `document.body.dataset`... Typed readonly ports carry route, locale,
// effective theme, reduced-motion and story progress into the scene.").
//
// The in-memory value is the application state owner. The DOM dataset remains
// write-only compatibility output; when the remaining CSS hooks move to Vue
// state, only `publishCurrentPage` needs to change.
//
// Read semantics are deliberately pull-based: consumers read the page at the
// same moment they did when they read the dataset, so the migration changes
// the source of the fact without changing any timing.
//
// The getter is pure of DOM reads and scene imports; the publisher is the only
// DOM-writing boundary and remains unit-testable under jsdom.
//
// Namespace note: the dataset carries a *PageId* (`'services'`), not a route
// *path* (`'/services'`). The port therefore validates against the manifest's
// page set (`MANIFEST_PAGES`) — the strict path resolvers in
// `routeManifest.ts` operate on a different namespace and must not be used
// here.

import type { PageId } from '../sections/_shared/constants'
import { MANIFEST_PAGES } from './routeManifest'

const PAGE_IDS: ReadonlySet<string> = new Set<string>(MANIFEST_PAGES)

let currentPage: PageId = 'home'

/** Read typed application route state; never read the DOM projection. */
export function getCurrentPage(): PageId {
  return currentPage
}

/** Publish the typed route page to the compatibility DOM projection. */
export function publishCurrentPage(page: PageId): void {
  if (!PAGE_IDS.has(page)) return
  currentPage = page
  document.body?.setAttribute('data-page', page)
  document.documentElement?.setAttribute('data-page', page)
}

/** Convenience predicate: `true` when the current page is `page`. */
export function isCurrentPage(page: PageId): boolean {
  return getCurrentPage() === page
}
