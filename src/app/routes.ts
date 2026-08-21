// src/app/routes.ts — Phase 5: Vue Router records built from the Phase 3
// route manifest.
//
// The manifest (`src/core/routeManifest.ts`) remains the single source of
// truth for public paths: the records below are derived from it, never
// re-declared. The component per record is the semantic route SFC
// (`src/app/views/*`). `pageForPath` is the lenient location resolution the
// initial-load contract needs (unknown direct entry → home, URL untouched);
// in-app navigation stays strict — the click handler and `jlz:navigate`
// resolve against the manifest before pushing, so an unknown link is a
// no-op exactly as with the legacy router.

import type { RouteRecordRaw } from 'vue-router'

import { ROUTE_MANIFEST, resolvePage } from '../core/routeManifest'
import type { PageId } from '../sections/_shared/constants'
import ContactView from './views/ContactView.vue'
import HomeView from './views/HomeView.vue'
import LabView from './views/LabView.vue'
import ManifestoView from './views/ManifestoView.vue'
import ServicesView from './views/ServicesView.vue'
import WorksView from './views/WorksView.vue'

export type { PageId }

const PAGE_VIEWS: Record<PageId, typeof HomeView> = {
  home: HomeView,
  services: ServicesView,
  works: WorksView,
  manifesto: ManifestoView,
  lab: LabView,
  contact: ContactView,
}

/** Lenient page resolution for a router location (initial-load contract). */
export function pageForPath(path: string): PageId {
  return resolvePage(path)
}

/**
 * The application's route records: one per manifest entry plus a catch-all
 * that renders `home` under an unknown stale URL (direct-entry fallback).
 * The catch-all is unreachable from in-app navigation: both entry points
 * (anchor clicks, `jlz:navigate`) strict-resolve before pushing.
 */
export function jlzRouteRecords(): RouteRecordRaw[] {
  const records: RouteRecordRaw[] = ROUTE_MANIFEST.map((entry) => ({
    path: entry.path,
    name: entry.page,
    component: PAGE_VIEWS[entry.page],
  }))
  records.push({
    path: '/:pathMatch(.*)*',
    name: 'fallback',
    component: PAGE_VIEWS[pageForPath('')],
  })
  return records
}
