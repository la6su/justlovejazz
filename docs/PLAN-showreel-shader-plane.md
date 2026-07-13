# PLAN — 3D Works page + Showreel shader plane + lazy video

## Strategy

### Video loading
- **Thumbnails** (textureUrl / detailTextureUrl): load eagerly with PROJECTS data.
  Already implemented — used as cube textures + work card covers.
- **Video**: load LAZILY on click. `preload="none"` on `<video>`, `src` set only
  when `open()` is called. No bandwidth cost until user explicitly requests.
- Rationale: fast FCP, minimal upfront load, video doesn't block 3D scene.

### Wobble scale on card click
- Already implemented on cube: `WorkCards.ts:107` dispatches `jlz:wobble-pulse`
  → `Experience.ts:451` listens → `SplashCube.triggerWobblePulse()`.
- MISSING: wobble animation on the card/3D plane itself. Need shader scale
  wobble on the clicked card BEFORE overlay opens.

### 3D portfolio grid for Works page
- Replace HTML/CSS `WorkCards.ts` (3D tilt cards via CSS perspective) with
  Three.js instanced grid of project planes with TSL shader hover effects.
- Same visual language as BakuCarousel (home works section) but grid layout.

## Plan — 6 phases

### Phase 1: Lazy video loading (quick win)

Modify `FullscreenOverlay.ts`:
- `<video preload="none">` (not `metadata`)
- `open()`: set `source.src` only when `videoSrc` provided, call `video.load()`
- Video starts loading on open, plays when ready (muted autoplay)
- Loading indicator while video buffers (CSS spinner on big-play button)

### Phase 2: Wobble scale shader on card click

New: `WorkCard3D` TSL component OR extend existing WorkCards with shader:
- On click: card plane scales 1.0 → 1.15 → 0.95 → 1.0 (wobble)
- Duration: 0.6s, spring easing
- Chromatic aberration burst on the card (like SplashCube wobble)
- After wobble completes → open FullscreenOverlay
- Implementation: CSS transform animation (quick) OR TSL shader (matches cube)

### Phase 3: 3D portfolio grid (`PortfolioGrid3D.ts`)

New file: `src/Experience/World/PortfolioGrid3D.ts`
- Three.js `InstancedMesh` of planes (one per project, 8 projects = 8 instances)
- Grid layout: 4 columns × 2 rows, responsive
- `MeshBasicNodeMaterial` with TSL nodes:
  - Project texture per instance (instanced texture array OR texture atlas)
  - Hover: scale 1.05 + emissive glow + chromatic edge
  - Click: wobble scale (Phase 2) + dispatch `jlz:open-project`
- Raycasting: `Experience.ts` raycasts on pointermove (hover) + click (select)
- Camera: static frontal view (no cube rotation — works page is grid-focused)

### Phase 4: Showreel button as TSL shader plane (`ShowreelButton3D.ts`)

New file: `src/Experience/World/ShowreelButton3D.ts`
- Three.js `Mesh` with `PlaneGeometry(0.4, 0.4)` at `z = 1.5` (in front of cube)
- TSL `NodeMaterial`:
  - Circular play button shape (discard outside circle)
  - Animated stroke ring (dashoffset animation on hover)
  - Play triangle in center (filled accent color)
  - Hover: ring stroke-animation, triangle scale 1.15
- Raycasting: click → dispatch `jlz:showreel-play`
- Position: center of cube face (replaces DOM button)

### Phase 5: Video plane with genie transition (`VideoPlane3D.ts`)

New file: `src/Experience/World/VideoPlane3D.ts`
- Three.js `Mesh` with `PlaneGeometry(16, 9)` (16:9 aspect)
- `VideoTexture` from hidden `<video>` element (lazy-loaded per Phase 1)
- `MeshBasicNodeMaterial` with TSL nodes:
  - Video texture mapping
  - Genie transition: scale + opacity + position from button → fullscreen
  - Chromatic aberration on transition (dramatic)
- Hidden by default. Shown on `jlz:showreel-play`.
- Custom DOM controls overlay (play/pause/seek) via CSS positioned over 3D plane.

### Phase 6: Integration + cleanup

- `Experience.ts`: add PortfolioGrid3D (works page), ShowreelButton3D (intro),
  VideoPlane3D (overlay). Raycaster wiring for all 3.
- Remove DOM showreel button from `intro/template.ts`.
- Remove HTML/CSS `WorkCards.ts` from works page (replace with 3D grid).
- Keep `FullscreenOverlay` for project-mode (poster + info) — only showreel
  moves to 3D plane. Project overlay stays DOM (simpler with BakuCarousel).
- `UIManager.ts`: showreel handler dispatches `jlz:showreel-play`.

## Implementation order (recommended)

1. **Phase 1** (lazy video) — 30 min, immediate UX win, no architecture change
2. **Phase 2** (wobble on card) — 1 hour, CSS animation quick win
3. **Phase 3** (3D portfolio grid) — 4-6 hours, major architecture
4. **Phase 4** (showreel button 3D) — 2-3 hours
5. **Phase 5** (video plane genie) — 3-4 hours
6. **Phase 6** (integration) — 1-2 hours

Total: ~12-16 hours of implementation.

## Technical notes

- **Instanced textures**: use `InstancedBufferAttribute` for per-instance
  texture coordinates, OR texture atlas (single texture, UV offset per instance).
  Atlas is simpler for 8 projects.
- **VideoTexture**: `<video>` hidden in DOM (`display: none`), `VideoTexture`
  updates on `requestVideoFrameCallback`. Muted autoplay allowed by browsers.
- **Raycasting**: add PortfolioGrid3D + ShowreelButton3D to Experience
  raycaster targets. Reuse existing BakuCarousel raycaster pattern.
- **Mobile**: PortfolioGrid3D scales to 2 columns × 4 rows. VideoPlane3D
  scales to viewport width, maintains 16:9.

## Files to create

- `src/Experience/World/PortfolioGrid3D.ts` — 3D instanced grid (Phase 3)
- `src/Experience/World/ShowreelButton3D.ts` — TSL shader button (Phase 4)
- `src/Experience/World/VideoPlane3D.ts` — Video plane + genie (Phase 5)

## Files to modify

- `src/UI/FullscreenOverlay.ts` — lazy video loading (Phase 1)
- `src/UI/WorkCards.ts` — wobble scale animation (Phase 2, then removed in 3)
- `src/Experience/Experience.ts` — add 3D components + raycaster (Phase 6)
- `src/sections/intro/template.ts` — remove DOM showreel button (Phase 6)
- `src/sections/works/template.ts` — remove HTML work cards (Phase 6)
- `src/UI/UIManager.ts` — showreel dispatch (Phase 6)
- `src/assets/main.less` — remove .jlz-showreel-*, .jlz-work-card-* styles

## Verification

- `bun run type-check` — 0 errors.
- `bun run lint` — 0 errors.
- `bun run build` — OK.
- `bun run test:unit` — all tests pass.
- Browser:
  - Works page: 3D grid renders, hover effects, click → wobble → overlay
  - Intro: showreel button 3D, click → genie transition → video plays
  - Video lazy loads on click (no upfront bandwidth)
  - Mobile: grid 2-col, video plane scales correctly
