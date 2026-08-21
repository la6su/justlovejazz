// src/core/routeResourceScopes.ts — Phase 3 pure route resource scope contract.
//
// The scene keeps route-scoped GPU resources (lazy stages) alive only while
// their route is active: the /works plane stage owns eight decoded 1440×810
// textures, and the /contact text + Cyprus stages own their media. Keeping an
// inactive stage alive makes that GPU allocation look like a navigation leak,
// so the legacy coordinator disposes stages on route change (the
// `_routeChangeCloseOverlayHandler` in `Experience.ts`) and pre-warms them on
// initial load (`World.forPage`).
//
// This contract extracts that policy as pure, framework-neutral data:
//
//   - the scope inventory (which resources exist, which page owns each, and
//     whether the scope is `persistent` or `route-scoped`);
//   - `routeScopeTransition(to)`, the acquire/dispose decision for a route
//     change — a total function over every `PageId`;
//   - strict lookups (no `home` fallback — the routePage lesson).
//
// Two scope classes, deliberately different:
//
//   - `persistent`: acquired lazily on entry to its page and never disposed
//     during the session. The home carousel is the only one; its four
//     project textures are shared with the Works plane media, so re-creating
//     it on every home visit would multiply GPU media.
//   - `route-scoped`: acquired on entry to its page and disposed on every
//     other page. Disposal is unconditional in the policy; the consumer's
//     dispose calls are no-op guarded, so disposing a stage that was never
//     created is safe.
//
// Pure by design: no DOM, Three, renderer or globals — unit-testable without
// a browser. Inert until consumed: the `Experience.ts` route-change handler
// and `World.forPage` keep their inline policy until the Phase 8 rewiring,
// so this slice changes no runtime behavior.
//
// Out of scope: section resets (`setWorksPlaneStageSection(0)`, the
// `setContact*Section(0)` calls) are scene-state concerns, not resource-scope
// policy, and stay with the consumer.

import type { PageId } from '../sections/_shared/constants'

export type ResourceScopeId =
  'carousel' | 'worksPlaneStage' | 'contactTextStage' | 'contactCyprusStage'

export type ResourceScopeKind = 'persistent' | 'route-scoped'

export interface ResourceScopeDef {
  readonly id: ResourceScopeId
  /** The only page that acquires the scope. */
  readonly page: PageId
  readonly kind: ResourceScopeKind
  /** Why the scope exists and how it is released (the editorial fact). */
  readonly note: string
}

/** The scope inventory, in acquisition order for a page. */
export const RESOURCE_SCOPES: readonly ResourceScopeDef[] = [
  {
    id: 'carousel',
    page: 'home',
    kind: 'persistent',
    note: 'Home Works carousel; shares four project textures with the Works plane media, so it is lazily initialized once and kept for the session.',
  },
  {
    id: 'worksPlaneStage',
    page: 'works',
    kind: 'route-scoped',
    note: 'Owns eight decoded 1440×810 textures; disposed off /works so the allocation does not look like a navigation leak.',
  },
  {
    id: 'contactTextStage',
    page: 'contact',
    kind: 'route-scoped',
    note: 'Contact text stage media; disposed off /contact.',
  },
  {
    id: 'contactCyprusStage',
    page: 'contact',
    kind: 'route-scoped',
    note: 'Contact Cyprus (frame 03) stage media; disposed off /contact.',
  },
] as const

const SCOPE_BY_ID = new Map<ResourceScopeId, ResourceScopeDef>(
  RESOURCE_SCOPES.map((scope) => [scope.id, scope]),
)

/** Every scope id, for exhaustive switches and iteration. */
export const RESOURCE_SCOPE_IDS: readonly ResourceScopeId[] = Object.freeze(
  RESOURCE_SCOPES.map((scope) => scope.id),
)

/** The route-scoped scope ids (the ones that can be disposed). */
export const ROUTE_SCOPED_IDS: readonly ResourceScopeId[] = Object.freeze(
  RESOURCE_SCOPES.filter((scope) => scope.kind === 'route-scoped').map((scope) => scope.id),
)

/** Strict lookup: `undefined` for an unknown scope id (never a default). */
export function resourceScopeById(id: ResourceScopeId): ResourceScopeDef | undefined {
  return SCOPE_BY_ID.get(id)
}

/** True when `id` is a known scope id. */
export function isResourceScope(id: string): id is ResourceScopeId {
  return SCOPE_BY_ID.has(id as ResourceScopeId)
}

/**
 * The scopes a page owns, in acquisition order (inventory order). A page
 * that owns nothing (services, manifesto, lab) gets an empty list.
 */
export function scopesForPage(page: PageId): readonly ResourceScopeDef[] {
  return RESOURCE_SCOPES.filter((scope) => scope.page === page)
}

export interface RouteScopeTransition {
  /** Scopes to (lazily) acquire on entry, in order. Persistent scopes are idempotent. */
  readonly acquire: readonly ResourceScopeId[]
  /** Route-scoped scopes to dispose; persistent scopes never appear here. */
  readonly dispose: readonly ResourceScopeId[]
}

/**
 * The acquire/dispose decision for a route change to `to`. Total over every
 * `PageId`:
 *
 * - `acquire` = the scopes owned by `to` (the home carousel included — its
 *   `ensure` is idempotent, so a repeat home visit is a no-op);
 * - `dispose` = every route-scoped scope not owned by `to` (the unconditional
 *   else-branch of the legacy handler; the consumer's no-op guards make
 *   disposing a never-created stage safe).
 */
export function routeScopeTransition(to: PageId): RouteScopeTransition {
  const owned = new Set(scopesForPage(to).map((scope) => scope.id))
  return {
    acquire: scopesForPage(to).map((scope) => scope.id),
    dispose: ROUTE_SCOPED_IDS.filter((id) => !owned.has(id)),
  }
}
