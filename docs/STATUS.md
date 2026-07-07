# STATUS — Single Source of Truth

> Updated: 2026-07-08. Branch: `main`. Build green.

## Project

SPA studio portfolio — 6 sections, 3D canvas + transparent DOM overlay. Single font: Inter.
Navigation: CircularNav (vinyl circle, bottom-right) + UIMenu (UIkit modal).

## Current state

| Item | Status |
| --- | --- |
| 3D scene (WebGPU + WebGL2 fallback) | ✅ |
| CircularNav — drag DOWN=next, UP=prev | ✅ |
| UIMenu — UIkit modal jump navigation | ✅ |
| BakuCarousel — cube morphs into ring (works §4) | ✅ |
| ProjectOverlay — card click (raycast) opens fullscreen | ✅ |
| On-demand rendering (`_needsRender` flag) | ✅ |
| Event-driven animations (static when idle) | ✅ |
| NoiseText titles via `jlz:section-change` | ✅ |
| Splash curtain + SplashCube opener | ✅ |
| DevPanel (Tweakpane, merged DebugStats) | ✅ |
| Per-section lighting + fog | ✅ |
| TypeScript strict + ESLint + Prettier | ✅ |
| Prerendered home sections (SEO) | ✅ |
| a11y (skip-link, focus-trap, noscript) | ✅ |
| 54 unit tests (CircularNav, Easings, EventBus, Noise) | ✅ |

## On-demand rendering

`renderer.update()` only called when `_needsRender=true`. Triggers:
1. CircularNav transition (`isActive()`)
2. BakuCarousel morphing/scrolling (`isAnimating` getter)
3. Splash/intro animation
4. Camera shake

When idle: zero draw calls, GPU sleeps. Cursor (DOM) always updates.

## Section layout

| Idx | Section | 3D content | BG |
| --- | --- | --- | --- |
| 0 | intro | SplashCube (baku), particles | White (light) |
| 1 | about | Particles | Dark |
| 2 | flexible | Particles (EMPTY placeholder) | Dark purple |
| 3 | challenge (works) | BakuCarousel + DrawTrail + particles | Dark |
| 4 | innovative | Particles | Dark |
| 5 | contact | Particles | Dark |

Sections: `position:absolute; inset:0` (stacked). `.section-active` toggles visibility.

## Removed (don't re-add)

| Module | Why |
| --- | --- |
| SmoothScroll/Lenis | SwipeNav/CircularNav drives navigation |
| CursorLight | Continuous animation, removed for on-demand |
| DebugStats | Merged into DevPanel (Tweakpane) |
| SectionProgress | Replaced by CircularNav |
| Particle drift | Particles are static (event-driven) |
| Section.update() emissive pulse | Was continuous, now no-op |
| import.meta.hot | Breaks module loading through proxy |
| Input.ts scroll system | Mouse-only now |

## Proxy/dev config

| Setting | Value | Why |
| --- | --- | --- |
| `server.hmr` | `false` | WebSocket unstable through proxy |
| `server.allowedHosts` | `['project.6la.ru']` | Caddy/haproxy reverse proxy |
| `block-vite-client` plugin | Strips `@vite/client` from HTML + stubs HTTP | Prevents reload loop |
| `main.less` import | `?inline` | Prevents `@vite/client` injection in CSS |

## Performance

- Shared MeshPhysicalNodeMaterial for all 6 cube faces (1 uniform group)
- Built-in materials for particles, ground, cards, edges
- `try/catch` in `update()` — logs error, skips frame, doesn't stop loop
- `prefers-reduced-motion` freezes decorative anims
