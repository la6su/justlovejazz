# STATUS — Single Source of Truth

> Updated: 2026-07-05. Branch: `main`. Build green (type-check + lint + build).

## Project

SPA studio portfolio — single page with 6 sections. 3D canvas (fixed) +
transparent DOM overlay (absolute-stacked sections). Single font: Inter.

**Navigation model:** SwipeNav (one-section-at-a-time swiper) + UIMenu
(UIkit modal for jump navigation). Page scroll is disabled
(`body { overflow: hidden }`).

## Current state

| Item | Status |
| --- | --- |
| 3D scene renders (WebGPU + WebGL2 fallback) | ✅ |
| SwipeNav — drag to move one section at a time (туда/сюда) | ✅ |
| UIMenu — UIkit modal for jump navigation | ✅ |
| BakuCarousel — baku cube morphs into carousel ring (works §4) | ✅ |
| ProjectOverlay — fullscreen project detail (card click opens) | ✅ |
| Custom cursor visible in fullscreen (z-index 100000) | ✅ |
| NoiseText title animation (glitch reveal) | ✅ |
| Splash screen (CSS curtain split + seam glow) | ✅ |
| SplashCube (Apple Fifth Avenue cube = baku) | ✅ |
| DrawTrail (about section only) | ✅ |
| Per-section lighting + fog (junni changeSection) | ✅ |
| Camera shake on section transition (reduced-motion gated) | ✅ |
| Portrait FOV adaptation | ✅ |
| Per-section cursor follow strength | ✅ |
| Single Inter font throughout | ✅ |
| TypeScript `strict: true` | ✅ |
| ESLint + Prettier configured | ✅ |
| Prerendered home sections (SEO) | ✅ |
| a11y (skip-link, dialog focus-trap, noscript) | ✅ |
| SEO (og/twitter/JSON-LD/sitemap) | ✅ |
| worldDNA TSL persistent shader (vertex displacement + color blend) | ✅ |
| Per-section worldDNA displacement amplitude | ✅ |
| Section blend drives GPU color morph | ✅ |
| TSL NodeMaterial on all scene objects | ✅ |
| Audio-reactive worldDNA (Web Audio API FFT → GPU uniforms) | ✅ |
| WebGPU TSL post-processing (bloom + vignette + grain + grade) | ✅ |
| Performance profiling (FPS, frame time, draw calls, backend) | ✅ |

## Removed (cleanup 2026-07-05)

These were deleted as dead code — do NOT re-add:

| Module | Why removed |
| --- | --- |
| SmoothScroll / Lenis | SwipeNav drives navigation; page doesn't scroll. ProjectOverlay locks body.overflow directly. |
| SectionProgress | Replaced by SwipeNav (`.jlz-swipenav*`). |
| CameraAnchors | Registered but never queried — camera blending uses Section.cameraTransform. |
| BorderOverlay | Never instantiated. |
| FlexibleSlides | Referenced in World.update but never instantiated. |
| AssetManager | Singleton with no-op disposeContext (nothing ever registered). |
| GPUResourceManager | Same — singleton with no-op disposeContext. |
| WorksPortfolio input/spring/expand code | BakuCarousel fully replaced the cube-face slider. Portfolio kept only as project-metadata + texture container. |
| CircularGallery (both copies) | Replaced by BakuCarousel. |
| `.jlz-works-*`, `.jlz-section-progress*`, `#project-modal .jlz-detail-*` CSS | Dead — no elements with those classes exist. |

## Renderer

Single `WebGPURenderer` (alpha:false, ACES tonemap, sRGB). Auto-fallback to WebGL2.

- WebGPU: direct `renderer.render()` (no post-processing — perf)
- WebGL2: ShaderMaterial RT pipeline (bloom/grain/vignette), single ACES pass
- Render loop pauses on hidden tabs (`visibilitychange` → `setAnimationLoop(null)`)

## Section layout

```
canvas.canvas (z-index:1, fixed, pointer-events:none) — 3D scene
#spa-content (z-index:2, transparent) — DOM sections (absolute-stacked, 100dvh each)
  section#section-intro     → 3D group 0 (white BG, particles)
  section#section-about     → 3D group 1 (dark BG, particles, DrawTrail)
  section#section-flexible  → 3D group 2 (dark purple BG, particles — EMPTY placeholder)
  section#section-challenge → 3D group 3 (dark BG, BakuCarousel)
  section#section-innovative→ 3D group 4 (dark BG, particles)
  section#section-contact   → 3D group 5 (light cream BG, particles)
```

Sections are `position:absolute; inset:0` — all stacked in the same viewport
cell. Only the section with `.section-active` is visible (opacity:1,
pointer-events:auto). Inactive sections are `opacity:0; pointer-events:none`.
ContentReveal toggles `.section-active` on `jlz:section-change`.

## Navigation surfaces

| Surface | Role | File |
| --- | --- | --- |
| SwipeNav | Bottom bar — drag 0→100% = one neighbor transition | `src/UI/SwipeNav.ts` |
| UIMenu | UIkit modal — jump to any section | `src/UI/UIMenu.ts` |
| BakuCarousel card click | Opens fullscreen ProjectOverlay | `src/Experience/World/BakuCarousel.ts` |

## Fonts

**Single font: Inter** (Google Fonts, weights 300-900).
master-quantum-flares sets 'Source Sans 3' — overridden in main.less.

## NoiseText

Glitch reveal: characters appear with random Y-offset + rotate + blur,
staggered left-to-right, settling into final position. Duration 1.2s.
Triggered by `jlz:webgl-ready` (initial) and `jlz:section-change` (nav).

## Splash

CSS curtain split — two panels (`#jlj-splash`) part vertically to reveal
the 3D SplashCube beneath. Seam glow line fades on open. `role=status`
+ `aria-live=polite` for SR. `jlz:webgl-ready` fires at curtain mid-open
(400ms) so the title animates in parallel with the cube reveal.

## Performance

- Particle counts scaled by `DeviceCapability.tier` (low 0.4× / medium 0.7×)
- `prefers-reduced-motion` freezes decorative 3D anims (baku, cursor light, draw trail, particles)
- `disposeMaterialDeep()` — disposes all material textures on section/page switch
- Resize debounced 150ms (avoids RT recreation spikes)
- BakuCarousel reuses 4 unique textures across 6 faces (no duplicate GPU resources)
- Per-frame allocations eliminated in SplashCube + BakuCarousel (scratch vectors)
- `clearProjectTextures()` called event-driven (section change), not every frame

## Known env issues

Chrome WebGPU on Wayland+NVIDIA: slow (ANGLE-OpenGL fallback).
Workaround: access via LAN IP. See `docs/ENVIRONMENT.md`.
