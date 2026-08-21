import { describe, it, expect } from 'vitest'
import {
  RESOURCE_SCOPES,
  RESOURCE_SCOPE_IDS,
  ROUTE_SCOPED_IDS,
  resourceScopeById,
  isResourceScope,
  scopesForPage,
  routeScopeTransition,
} from '../core/routeResourceScopes'
import { MANIFEST_PAGES } from '../core/routeManifest'

describe('route resource scope inventory', () => {
  it('declares exactly the four scene GPU scopes with their owners', () => {
    expect(RESOURCE_SCOPES).toHaveLength(4)
    expect(RESOURCE_SCOPE_IDS).toEqual([
      'carousel',
      'worksPlaneStage',
      'contactTextStage',
      'contactCyprusStage',
    ])
    expect(RESOURCE_SCOPES.map((s) => s.page)).toEqual(['home', 'works', 'contact', 'contact'])
    expect(RESOURCE_SCOPES.map((s) => s.kind)).toEqual([
      'persistent',
      'route-scoped',
      'route-scoped',
      'route-scoped',
    ])
  })

  it('the home carousel is the only persistent scope', () => {
    expect(ROUTE_SCOPED_IDS).toEqual(['worksPlaneStage', 'contactTextStage', 'contactCyprusStage'])
    const persistent = RESOURCE_SCOPES.filter((s) => s.kind === 'persistent')
    expect(persistent).toHaveLength(1)
    expect(persistent[0]?.id).toBe('carousel')
    expect(persistent[0]?.page).toBe('home')
  })

  it('strict lookup: unknown ids are undefined, never a default', () => {
    expect(resourceScopeById('carousel')?.page).toBe('home')
    expect(resourceScopeById('worksPlaneStage')?.page).toBe('works')
    expect(isResourceScope('carousel')).toBe(true)
    // The namespace lesson: scope ids are not PageIds and not route paths.
    expect(isResourceScope('home')).toBe(false)
    expect(isResourceScope('/works')).toBe(false)
  })
})

describe('scopesForPage', () => {
  it('home owns the carousel, works owns its stage, contact owns both stages', () => {
    expect(scopesForPage('home').map((s) => s.id)).toEqual(['carousel'])
    expect(scopesForPage('works').map((s) => s.id)).toEqual(['worksPlaneStage'])
    expect(scopesForPage('contact').map((s) => s.id)).toEqual([
      'contactTextStage',
      'contactCyprusStage',
    ])
  })

  it('pages without scenes own no scopes', () => {
    expect(scopesForPage('services')).toEqual([])
    expect(scopesForPage('manifesto')).toEqual([])
    expect(scopesForPage('lab')).toEqual([])
  })
})

describe('routeScopeTransition (the acquire/dispose policy)', () => {
  it('is total over every manifest page', () => {
    for (const page of MANIFEST_PAGES) {
      const t = routeScopeTransition(page)
      expect(t.acquire.every((id) => RESOURCE_SCOPE_IDS.includes(id))).toBe(true)
      expect(t.dispose.every((id) => RESOURCE_SCOPE_IDS.includes(id))).toBe(true)
    }
  })

  it('entry to home acquires the carousel and disposes the route-scoped stages', () => {
    expect(routeScopeTransition('home')).toEqual({
      acquire: ['carousel'],
      dispose: ['worksPlaneStage', 'contactTextStage', 'contactCyprusStage'],
    })
  })

  it('entry to works acquires the works stage and disposes the contact stages', () => {
    expect(routeScopeTransition('works')).toEqual({
      acquire: ['worksPlaneStage'],
      dispose: ['contactTextStage', 'contactCyprusStage'],
    })
  })

  it('entry to contact acquires both contact stages and disposes the works stage', () => {
    expect(routeScopeTransition('contact')).toEqual({
      acquire: ['contactTextStage', 'contactCyprusStage'],
      dispose: ['worksPlaneStage'],
    })
  })

  it('content pages acquire nothing and dispose every route-scoped stage', () => {
    for (const page of ['services', 'manifesto', 'lab'] as const) {
      expect(routeScopeTransition(page), page).toEqual({
        acquire: [],
        dispose: ['worksPlaneStage', 'contactTextStage', 'contactCyprusStage'],
      })
    }
  })

  it('disposal is unconditional: the else-branch disposes even scopes never created', () => {
    // From a cold home (no works/contact stage exists yet), navigating to a
    // content page still lists all route-scoped stages for disposal — the
    // consumer's no-op guards make that safe. This mirrors the legacy
    // handler exactly.
    const fromHome = routeScopeTransition('manifesto')
    expect(fromHome.dispose).toContain('worksPlaneStage')
    expect(fromHome.dispose).toContain('contactTextStage')
    expect(fromHome.dispose).toContain('contactCyprusStage')
  })

  it('the persistent carousel is never disposed', () => {
    for (const page of MANIFEST_PAGES) {
      expect(routeScopeTransition(page).dispose, page).not.toContain('carousel')
    }
  })

  it('a page never disposes a scope it acquires (no acquire/dispose overlap)', () => {
    for (const page of MANIFEST_PAGES) {
      const t = routeScopeTransition(page)
      for (const id of t.acquire) {
        expect(t.dispose, page).not.toContain(id)
      }
    }
  })
})
