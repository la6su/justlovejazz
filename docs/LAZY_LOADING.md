# LAZY_LOADING — Architectural Plan

> Last updated: 2026-06-17. See `docs/STATUS.md` for canonical bundle sizes.

## Problem

Startup cost vs studio-grade mobile UX. Historical baseline reported
oversized core chunk; current state is much improved.

## Current bundle (2026-06-17)

```
chunk-core         644 KB  gzip 184 KB  (three + TSL + BloomNode)
chunk-assets       625 KB  gzip 167 KB  (AssetManager)
chunk-experience   251 KB  gzip  85 KB
chunk-text         122 KB  gzip  45 KB  (troika-three-text)
entry-app           13 KB  gzip   4 KB
chunk-camera         5 KB  gzip   2 KB
chunk-shaders        1 KB  gzip   1 KB
```

No oversized warning (Vite default `chunkSizeWarningLimit` = 1000KB).
`chunk-core` is largest but acceptable. Lazy-loading already used in
`src/main-app.ts` (ErrorTracker, UIManager, Bootstrapper, DissolveOverlay
are dynamic imports).

## Goal

Reduce startup cost without introducing fragile loading orchestration.
Current state is acceptable; further work deferred until real-perf data
from Lighthouse on production hardware.

## Tiers

| Tier | Content | Target |
|------|---------|--------|
| 1. Critical | entry + renderer init + minimal UI shell | fast first interactive frame |
| 2. Route Feature | route-specific scene/UI blocks | loaded only when needed |
| 3. Heavy Assets | large textures, optional media | deferred |
| 4. Non-Critical UX | secondary effects/text extras | deferred |

## Performance Budget

| Metric | Target | Current |
|--------|--------|---------|
| Build warning | no oversized on critical chunk | ✅ none |
| First interactive frame | improved vs historical baseline | ✅ improved |
| Total warm load | no regression | ✅ stable |
| Visual stability | no route flicker during deferred loads | ✅ stable |

## Design Decisions

- Do not over-engineer bootstrap sequence.
- Prefer Vite-native code splitting and route/feature boundaries first.
- Defer optional effects only after behavior remains deterministic.
- `vite.config.ts` `manualChunks` already splits vendor (three/troika/uikit)
  from app code.

## Implementation Order (status)

1. ✅ Measured current chunk map (see above).
2. ✅ Split by route/feature boundary (manualChunks in vite.config.ts).
3. ✅ Verified no runtime regressions in page transitions + gallery flow.
4. ⏳ Defer heavy assets behind explicit activation points — pending
   bespoke assets (Track 6).
5. ✅ Build thresholds documented in `docs/STATUS.md`.
