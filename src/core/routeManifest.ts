// src/core/routeManifest.ts — Phase 3 pure route contract.
//
// The single source of truth for the application's public paths. Consumers
// (the legacy router today, Vue Router later) resolve against this manifest
// instead of re-declaring the mapping. Pure by design: no DOM, no window, no
// globals — unit-testable without a browser.
//
// Adding or renaming a route is a change here plus one line in the router;
// the mapping must never be duplicated.

import type { PageId } from '../sections/_shared/constants'

export interface RouteEntry {
  readonly path: string
  readonly page: PageId
}

/** Every public route, in the order the navigation menu presents them. */
export const ROUTE_MANIFEST: readonly RouteEntry[] = [
  { path: '/', page: 'home' },
  { path: '/services', page: 'services' },
  { path: '/works', page: 'works' },
  { path: '/manifesto', page: 'manifesto' },
  { path: '/lab', page: 'lab' },
  { path: '/contact', page: 'contact' },
] as const

/** Every page the manifest maps to, in manifest order. */
export const MANIFEST_PAGES: readonly PageId[] = Object.freeze(
  ROUTE_MANIFEST.map((entry) => entry.page),
)

const PAGE_BY_PATH = new Map<string, PageId>(
  ROUTE_MANIFEST.map((entry) => [entry.path, entry.page]),
)

/**
 * Strict lookup: `undefined` for a path the manifest does not own. Navigation
 * (history push) should only target known paths — unknown paths must be a no-op
 * so a typo in a link never silently lands the user on `home`.
 */
export function resolveRoute(path: string): PageId | undefined {
  return PAGE_BY_PATH.get(path)
}

/**
 * Lenient resolution: the mapped page, or `home` for unknown paths. This is
 * the initial-load behaviour — a shared deep link to a stale or preview path
 * should still present the application at its home face.
 */
export function resolvePage(path: string): PageId {
  return PAGE_BY_PATH.get(path) ?? 'home'
}

/** True when the manifest owns the path (strict lookup). */
export function isRoutePath(path: string): boolean {
  return PAGE_BY_PATH.has(path)
}
