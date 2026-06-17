# Works Sticky Rebuild Plan

> Status: ✅ IMPLEMENTED — `src/Experience/WorksPortfolio.ts` +
> `src/Experience/ProjectCarousel.ts` exist and are wired into
> `Experience.ensurePortfolio()`. This file is kept as historical reference.
> See `docs/STATUS.md` for current state.

## Goal

Bring `#works` to a production-ready sticky experience inspired by `StickyImageEffect`, adapted to this repository architecture:

- sticky preview panel;
- scroll-driven active item in project list;
- click-to-open project (reverse interaction compared to hover-only reveal);
- synchronized with existing 3D gallery/detail transition flow.

## Constraints

- No asset/content copying.
- Keep WebGPU primary and WebGL fallback behavior untouched.
- Preserve strict TypeScript and existing app state flow.

## Implementation Steps

1. Structure
   - Keep `#works` section as host.
   - Render list + sticky preview inside `ProjectGallery`.

2. Scroll-driven activation
   - Track list item centers relative to viewport.
   - Set active project by nearest item to section focus line while `#works` is visible.
   - Sync active item with `GalleryManager.setProject`.

3. Click-to-open behavior
   - On item click: focus manager index, ensure textures loaded, expand card.
   - Preserve existing `ProjectDetail` open/close lifecycle.

4. Motion and feedback
   - Add pointer/velocity parallax for preview image.
   - Add active/hover states with clear typography hierarchy.
   - Respect reduced-motion behavior where possible.

5. Layout hardening
   - Make `#works` tall enough for sticky narrative scroll.
   - Desktop: sticky preview + vertical list.
   - Mobile: stacked layout without sticky trap.

6. Verification
   - `npm run type-check`
   - `npm run build`
   - `npm test` when environment allows local server binding.

## Definition of Done

- Works section has stable sticky preview UX.
- Active item updates from scroll, not only hover.
- Click always opens correct project via existing 3D/detail pipeline.
- Build/type-check pass.
