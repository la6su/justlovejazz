# RULES — Hard rules. Each has bug provenance. Follow or break the project.

> LLM agent: read this BEFORE changing code. Every rule below was paid for in
> debugging time. Breaking one = reintroducing a fixed bug.

## Sync

```bash
git fetch origin && git checkout main && git pull origin main
```

## Rendering & Three.js

1. **No raw ShaderMaterial in scene** — TSL NodeMaterial only (native WebGPU path).
2. **TSL NodeMaterial IS allowed** — it's the portable WebGPU path.
3. **ONE shared NodeMaterial per multi-face object** — uniform group limit (baku cube).
4. **Built-in materials for particles/ground/cards** — MeshBasicMaterial, PointsMaterial, MeshStandardMaterial. No TSL for simple textured planes.
5. **Non-destructive opacity** — cache `baseOpacity` in `userData`. Never overwrite material opacity without restoring on transition out.
6. **`setAnimationLoop` — NOT rAF.** WebGPURenderer on WebGPU backend REQUIRES setAnimationLoop for correct frame pacing (rAF → 3 FPS stutter observed). On WebGL2 it falls back to rAF internally.
7. **`scene.background` — NOT set.** EnvSphere is the SOLE background. Setting scene.background causes a flash on theme switch.
8. **`alpha: false` for WebGPURenderer** — opaque canvas. Transparency handled via DOM overlay.
9. **Never remove SplashCube (baku)** — central 3D object. Even when invisible, its update() drives worldDNA.
10. **section-bg transparent** — DOM sections sit over the 3D canvas. Never give them an opaque background.
11. **On-demand rendering** — `_needsRender` event-driven only. Set by: JoystickNav, BakuCarousel, SplashCube opener, camera shake, ParticleBurst, mousemove (Works DrawTrail), ambient breathing (1 frame/2.5s — the ONLY exception to "render only when changing").
12. **`try/catch` in `update()`** — log + skip frame. Never let one bad frame crash the render loop.
13. **MSAA**: `samples: 4` on scene WebGLRenderTarget. Renderer `antialias: true` doesn't work for RT rendering.
14. **Visual tiers**: `DeviceCapability.isRealWebGPU` gates backend. SplashCube + EnvSphere must look identical on both paths (parity).

## Splash & Enter button (CRITICAL)

15. **Enter button DISABLED until `jlz:webgl-ready`.** The button is always visible but `pointer-events:none; opacity:0.5` until 3D is fully initialized. Under CPU/network throttling, `Experience.init()` takes 10-20s — that's expected. NEVER activate Enter early via a timeout fallback (was 4s/5s — caused users to click into uninitialized scene: no carousel, no baku cube). The ONLY valid signal is `jlz:webgl-ready`.
16. **`jlz:webgl-ready` must fire** — emitted by `main-app.ts` when `Experience.init()` completes. If init() throws, emit `jlz:webgl-failed` instead → load error shown (NOT Enter).
17. **Hard fallback = load error, NOT Enter.** 60s timeout in `entry-app.ts` + `index.html`. If `jlz:webgl-ready` hasn't fired, something is broken — show an error + Retry link, not a button that leads to a broken scene.
18. **`jlz:webgl-ready` must fire** — emitted by `main-app.ts` after `Experience.init()` resolves. Never emit before init completes.
19. **Splash is inline in `index.html`** — no separate splash page, no navigation flash. Fades out via `fade-out` class on `#jlz-app-loader`.

## Ground plane

20. **Ground plane visible ONLY on section 4 (bottom cube face -Y).** `Experience.ts`: `this.world.groundPlane.visible = this.world.currentSectionIndex === 4`. On all other sections the floor is hidden — the 3D scene floats in void. Section 4's `groundOpacity` is 0.25 (visibly grounded). Do NOT re-enable ground on other sections or tie it to `showGallery` (old bug: `!showGallery` showed ground everywhere except Works).

## Navigation & sections

21. **Section IDs**: `lab`, `intro`, `about`, `challenge` (works), `contact`, `process`. 1:1 cube faces. `challenge` is the historical name for Works — kept for backward compat (renaming touches Phase enum, WorldConfig, PostProcessingManager, Lights, scene group names). Documented in RULES.
22. **Cube-map layout on ALL pages**: 0=secret, 1=intro(start), 2-4=main, 5=secret. Vertical cycles 1-4, horizontal toggles 0/5.
23. **JoystickNav — pure DOM, NO three-joystick.** Trigger model. 2D: vertical=1-4, horizontal=0/5 secret. Same on ALL pages.
24. **Footer removed** — joystick is the sole bottom UI element. Do NOT re-add a footer/dock bar.
25. **`#project-overlay` reused** — single fullscreen overlay for both home BakuCarousel card click AND works page WorkCards click. Opened via `jlz:open-project` event (works page) or direct `showContainer()` (home carousel).
26. **BakuCarousel — home page Works section ONLY.** Content pages don't init the carousel (no cube morphing). `World.ts` checks `document.body.dataset.page === 'home'`.
27. **DrawTrail — Works section (idx=3) ONLY.** Mouse trail follows cursor only on the works section of the home page.

## i18n & meta tags

28. **`data-i18n` on ALL user-visible text.** Templates render English as default content (no-JS fallback); `applyTranslations()` overwrites with the current language. Key naming: flat dot notation (`home.studio.title`, `services.creativeDirection.lead`, `common.explore`).
29. **`applyTranslations()` runs in router** on every `renderView()` + on `jlz:lang-change`. Do NOT call it ad-hoc from components.
30. **Route-based meta tags** — `applyMetaTags(page)` called in router on every route change + lang change. Updates `<title>`, `<meta description>`, OG, Twitter, canonical, `<html lang>`. Values from i18n dictionary (`meta.<page>.title` / `.description`).
31. **i18n keys live in `src/core/i18n.ts`** — single source of truth. Add keys there FIRST, then reference in templates. Never inline translated strings in TS code.
32. **Project names stay English** — proper nouns (Undercurrent, Mono Sunday, etc.) are NOT translated. Only section titles, leads, descriptions, and CTAs are translated.

## Works page 3D cards

33. **WorkCards.ts** — 3D tilt + click handler for `.jlz-work-card` elements. CSS custom props `--rx`/`--ry` set on pointermove (batched single rAF). Click dispatches `jlz:open-project { idx }` → Experience opens ProjectOverlay.
34. **`initWorkCards()` is idempotent** — called on every `jlz:route-change` (works page render). Skips already-bound cards via `data-jlz-bound` attribute.
35. **8 projects in `Data/Projects.ts`** — 4 sections × 2 cards. Each card references project by index (`data-project-idx`). Do NOT reorder PROJECTS array (indices are positional).

## Theme & styling

36. **QF theme principle**: `@global-primary-background = @jlz-color-accent` (1 line in `_import.less` §3). QF manages ALL components. Do NOT override `@button-*`, `@card-*`, `@navbar-*`.
37. **Theme system**: 2-mode (auto=light/inverse=dark). Global flip, NOT per-section. `uk-light` on body. `localStorage('jlz:theme')`. EnvSphere syncs via `jlz:theme-applied`.
38. **Single font: Inter.** Preloaded in `index.html` (3 weights: 400, 700, 900).
39. **Mobile-first rem sizing**: `html { font-size: 0.85rem }` mobile → `1rem` ≥640px. ALL sizing rem-based (hairline borders exception).
40. **Responsive sections**: `uk-section-small uk-section-large@m` (UIKit3 has NO `uk-section-medium` — only xsmall/small/large/xlarge + bare).
41. **Design tokens**: `_import.less` §1-2. Single source of truth. master-qf MUST NOT duplicate UIKit globals.
42. **CSS imports use `?inline` suffix** — prevents Vite from injecting `@vite/client` (breaks through reverse proxy: `/@vite/client` resolves to Next.js app returning HTML instead of JS).
43. **`server.hmr: false` + `block-vite-client` plugin** — HMR breaks through the reverse proxy. Full reload on change.

## Events & lifecycle

44. **EventBus typed** — no raw `window.dispatchEvent` for events that have EventBus types. `jlz:route-change` covers navigation.
45. **`jlz:open-project`** — CustomEvent dispatched by WorkCards.ts (works page card click). Detail: `{ idx: number }`. Consumed by Experience.ts → opens ProjectOverlay.
46. **`Experience.destroy()`**: clear `window.experience`, `Experience.instance`, cancel rAF via `setAnimationLoop(null)`, remove all listeners. Every window listener must be tracked + removed.
47. **NoiseText via `jlz:section-change`** (home) / `jlz:page-section-change` (content pages) — NOT IntersectionObserver. Stable source via `data-eyebrow-text` attribute.

## Build & verification

48. **Always verify**: `bun run lint && type-check && build && test:unit`. 0 errors required (warnings tracked).
49. **No `import.meta.hot`** — breaks proxy module loading. Use `import.meta.env.DEV` for dev-only code.
50. **`references/` READ-ONLY** — never modify files in `references/`.
51. **master-quantum-flares DO NOT TOUCH** — QF vars ARE configurable via `@global-*` in `_import.less`, but the QF package itself is vendored and frozen.

## Removed (don't re-add)

| Module | Reason |
| --- | --- |
| SmoothScroll/Lenis | JoystickNav drives navigation |
| CursorLight | Conflicts with on-demand rendering |
| CircularNav | Replaced by JoystickNav |
| three-joystick | JoystickNav is pure DOM |
| ShaderBackground | Replaced by EnvSphere |
| BG.ts | Dead computation (bg.color never read) |
| Section3Flexible/Section5Innovative | 8→6 section unification |
| `src/styles/tokens.less` | Merged into `_import.less` |
| Custom `body.light-theme .uk-*` | Replaced by UIKit `uk-light` |
| Particles on Lab/About/Contact/Process | Kept only on Intro + Works |
| EdgesGeometry (rainbow edges) | LineSegments linewidth>1 unsupported → aliasing |
| Landing page (`/landing`) | Removed — no no-JS fallback needed, SPA renders synchronously |
| Footer/dock bar | Joystick is sole bottom UI |
| `jlz:navigate` event | Use `jlz:route-change` (typed in EventBus) |
| `PROCESS_STEPS` constant | Inline in section templates now |
| `worldDNA.ts` | TSL node system dead code |
| `Easings.ts` | Inline `easeInOutQuart` only |
