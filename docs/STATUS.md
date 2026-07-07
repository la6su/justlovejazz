# STATUS — Single Source of Truth

> Updated: 2026-07-07. Branch: `main`. Build green (type-check + lint + build).

## Project

SPA studio portfolio — 6 sections. 3D canvas (fixed) + transparent DOM overlay
(absolute-stacked sections). Single font: Inter.

**Navigation:** CircularNav (bottom-right vinyl-record dial, drag arc to move
one section) + UIMenu (UIkit modal for jump navigation). Page scroll disabled.

## Current state

| Item | Status |
| --- | --- |
| 3D scene renders (WebGPU + WebGL2 fallback) | ✅ |
| CircularNav — vinyl-record dial, drag along arc to navigate | ✅ |
| UIMenu — UIkit modal (`uk-modal`) for jump navigation | ✅ |
| BakuCarousel — baku cube morphs into carousel ring (works §3) | ✅ |
| Card click via raycast → ProjectOverlay fullscreen | ✅ |
| SplashCube — ONE shared MeshPhysicalNodeMaterial (was 6) | ✅ |
| WebGPU TSL post-processing re-enabled (bloom + vignette + grain + grade) | ✅ |
| try/catch in `Experience.update()` — animation loop survives errors | ✅ |
| DebugStats shows `drawCalls` (per-frame, not cumulative `calls`) | ✅ |
| Proxy/HMR fixes (server.hmr:false, `@vite/client` stripped, `?inline` CSS) | ✅ |
| Custom cursor visible in fullscreen (z-index 100000) | ✅ |
| NoiseText title animation (glitch reveal on jlz:section-change) | ✅ |
| Splash screen (CSS curtain split + seam glow) | ✅ |
| DrawTrail (about + flexible sections) | ✅ |
| Per-section lighting + fog | ✅ |
| Camera shake on section transition (reduced-motion gated) | ✅ |
| Portrait FOV adaptation | ✅ |
| Per-section cursor follow strength (works=0.22, others=0.15) | ✅ |
| worldDNA TSL persistent shader (vertex displacement + color blend) | ✅ |
| Audio-reactive worldDNA (Web Audio API FFT → GPU uniforms) | ✅ |
| Prerendered home sections (SEO) | ✅ |
| a11y (skip-link, dialog focus-trap, noscript) | ✅ |
| SEO (og/twitter/JSON-LD/sitemap) | ✅ |
| TypeScript `strict: true` + ESLint + Prettier | ✅ |

## Removed (do NOT re-add)

| Module | Why removed |
| --- | --- |
| SmoothScroll / Lenis | CircularNav drives navigation; page doesn't scroll. ProjectOverlay locks `body.overflow` directly. |
| SectionProgress | Replaced by CircularNav. |
| CameraAnchors | Registered but never queried — camera uses `Section.cameraTransform`. |
| BorderOverlay | Never instantiated. |
| FlexibleSlides | Referenced in World.update but never instantiated. |
| AssetManager | Singleton with no-op disposeContext. |
| GPUResourceManager | Same — singleton with no-op disposeContext. |
| WorksPortfolio input/spring/expand/texture-loading | BakuCarousel fully replaced cube-face slider. Portfolio now metadata-only. |
| CircularGallery (both copies) | Replaced by BakuCarousel. |
| Subtitles | Disabled — will return as 3D environment element. |
| Input scroll system (scrollY/scrollVelocity/update) | Page doesn't scroll. Only mouse remains. |
| `setProjectTextures` / `clearProjectTextures` (SplashCube) | No per-face textures — BakuCarousel owns works visuals. |
| 6 NodeMaterials on SplashCube | ONE shared material — WebGL binding-point limit. |
| Dead types: `ViewState`, `CameraState`, `NARRATIVE_PHASES`, `ALL_SECTIONS`, `RendererCapabilities`, `PostPreset` | Unused outside declarations. |
| Dead methods: `setBasePosition`, `getVelocity`, `setMuted`, `setSection`, `getSectionPreset`, `setupEventListeners` | Only self-referenced. |
| `.jlz-works-*`, `.jlz-section-progress*`, `#project-modal .jlz-detail-*` CSS | No matching elements in DOM. |

## Renderer

Single `WebGPURenderer` (alpha:false, ACES tonemap, sRGB). Auto-fallback to
WebGL2 (with `WebGLNodesHandler` for NodeMaterial compatibility).

| Backend | Render | Post |
| --- | --- | --- |
| WebGPU | TSL RenderPipeline (`WebGPUPostPipeline`) — bloom + vignette + grain + color grade | ✅ re-enabled |
| WebGL2 | ShaderMaterial RT pipeline — bloom/grain/vignette/chromatic/refraction/grade | single ACES pass |

- Render loop pauses on hidden tabs (`visibilitychange` → `setAnimationLoop(null)`)
- `Experience.update()` wrapped in try/catch — error logs once, loop continues

## Section layout

```
canvas.canvas          (z:1, fixed, pointer-events:none)  3D scene
#spa-content           (z:2, transparent)                 DOM sections (absolute-stacked, 100dvh each)
  section-intro        → group 0  (white BG, particles)
  section-about        → group 1  (dark BG, particles, DrawTrail)
  section-flexible     → group 2  (dark purple BG, particles — EMPTY placeholder)
  section-challenge    → group 3  (dark BG, BakuCarousel) ← "works"
  section-innovative   → group 4  (dark BG, particles)
  section-contact      → group 5  (light cream BG, particles)
#circ-nav              (z:9999, fixed bottom-right)       CircularNav dial
#jlz-menu-toggle       (z:10001)                          UIMenu hamburger
#jlz-menu-modal        (z:10000, UIkit modal)             UIMenu overlay
#project-overlay       (z:3500, fixed)                    ProjectOverlay fullscreen
.custom-cursor         (z:100000, fixed)                  above all overlays
```

Sections `position:absolute; inset:0` — stacked in one viewport cell.
`.section-active` toggles visibility (opacity:1, pointer-events:auto).
ContentReveal toggles on `jlz:section-change`.

## Performance

- Particle counts scaled by `DeviceCapability.tier` (low 0.4× / medium 0.7×)
- `prefers-reduced-motion` freezes decorative 3D anims (baku, cursor light, draw trail, particles)
- `disposeMaterialDeep()` disposes material textures on section/page switch
- Resize debounced 150ms (avoids RT recreation spikes)
- SplashCube: ONE shared NodeMaterial (1 uniform group, not 6)
- BakuCarousel reuses 4 unique textures across 6 faces
- Built-in materials for particles, ground, BakuCarousel cards, SplashCube edges (no per-mesh NodeMaterial)
- Per-frame allocations eliminated (scratch vectors in SplashCube + BakuCarousel)
- DebugStats updates once per second (no per-frame layout reflow)

## Known env issues

Chrome WebGPU on Wayland+NVIDIA: slow (ANGLE-OpenGL fallback). Workaround:
LAN IP access. See [docs/ENVIRONMENT.md](ENVIRONMENT.md).

## Proxy/dev-server config

- `server.hmr: false` (HMR WebSocket unstable through reverse proxy)
- `server.allowedHosts: ['project.6la.ru']`
- `block-vite-client` plugin: strips `@vite/client` script tag in
  `transformIndexHtml` + stubs the HTTP request via middleware
- `main.less` imported via `?inline` (prevents `@vite/client` injection in CSS)
- All `import.meta.hot` calls removed from source
