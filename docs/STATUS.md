# STATUS — Single Source of Truth

> Updated: 2026-07-11. Branch: `main`. Build green. Tag: `backup-2026-07-11-v2`.

## Project

SPA studio portfolio — **6 pages** (SPA routes), each with **4 main sections**.
Single HTML entry (index.html) with seamless inline splash overlay.
3D canvas + transparent DOM. Single font: Inter.
Navigation: JoystickNav (pure DOM + dotnav) + UIMenu (transparent navbar + dropdowns).
Theme: per-section inverse (auto = preset, inverse = flipped) via ContentReveal.
i18n: EN/RU toggle (structure ready, data-i18n attributes pending on templates).
Mobile-first: `html { font-size: 0.85rem }` mobile → `1rem` ≥640px.

Multi-page: index (/) → blog (/blog + /blog/[slug] standalone for SEO).

## Pages (6) — SPA routes

| Page | Route | Sections (joystick down/up) |
| --- | --- | --- |
| Studio | `/` | 01 Studio / 02 Services / 03 Works / 04 Manifesto |
| Services | `/services` | 01 Creative Direction / 02 Interactive Dev / 03 Motion & Realtime / 04 AI Systems |
| Works | `/works` | 01 Undercurrent / 02 Mono Sunday / 03 Till at Night / 04 Ebb Vibes |
| Manifesto | `/manifesto` | 01 Purpose / 02 Clarity / 03 Emotion / 04 Simplicity |
| Lab | `/lab` | 01 Shader Lab / 02 Audio Reactive / 03 Generative / 04 GPU Particles |
| Contact | `/contact` | 01 Email / 02 Social / 03 Location / 04 Form |

## Current state

| Item | Status |
| --- | --- |
| 3D scene (WebGPU + WebGL2 fallback) | ✅ |
| 6 pages — SPA routes | ✅ |
| Unified sectionShell() — ONE wrapper for all pages | ✅ |
| Seamless inline splash (Enter button + SVG squares + progress ring) | ✅ |
| three.js lazy loading (dynamic import, non-blocking FCP) | ✅ |
| JoystickNav — pure DOM + dotnav timeline | ✅ |
| UIMenu — transparent navbar + dropdowns + theme toggle | ✅ |
| BakuCarousel — home page only (Works section) | ✅ |
| SplashCube — RoundedBoxGeometry + CubeCamera (throttled) | ✅ |
| Per-section inverse theme (ContentReveal) | ✅ |
| Custom cursor — codrops-style (skip redraw when idle) | ✅ |
| BlurFade — cinematic blur+stagger for titles | ✅ |
| NoiseText — console typewriter for eyebrow numbers | ✅ |
| Footer removed — joystick sole bottom UI | ✅ |
| Blog standalone (blog.less, SEO) | ✅ |
| i18n — EN/RU structure (i18n.ts, lang toggle wired) | ✅ |
| SEO — sitemap 6 SPA pages + JSON-LD + meta tags | ✅ |
| Performance — CubeCamera throttle + bloom skip + leak fixes | ✅ |
| Mobile QA — 390px viewport passed | ✅ |
| Lighthouse — Performance 100 (FCP ~200ms) | ✅ |
| Ponytail audit — -632 LOC dead code removed | ✅ |
| TypeScript strict + ESLint + Prettier | ✅ |
| 9 unit tests | ✅ |

## Remaining work

| Item | Priority |
| --- | --- |
| data-i18n attributes on templates (apply translations) | Medium |
| Blog post design polish (code highlighting, images) | Low |
| 3D objects on content pages (ShaderOrb, WireframeTypography) | Medium |
| Route-based meta tags (per-page title/description) | Medium |
| Lighthouse re-run after all changes | Low |

## Proxy/dev config

| Setting | Value |
| --- | --- |
| `server.hmr` | `false` |
| `server.allowedHosts` | `['project.6la.ru']` |
| `block-vite-client` plugin | Strips @vite/client + stubs HTTP |
| CSS import | `?inline` |
