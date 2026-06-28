# CHANGELOG

## 2026-06-28

### Optimization sprints 1-5 + bug fixes (PR #79)

Thirteen commits across two phases. Full audit + targeted fixes based on a
deep codebase analysis.

**Sprint 1 — Stabilization**
- `chore`: remove 3.2 MB dead assets (`public/assets/references/`, `studio.hdr`, stray PNGs); untrack `.idea/`/`.claude/`/`test-results/`; delete `ts5112-fix.json` (leaked LLM artifact) + orphaned `lighthouse.config.json`
- `chore(deps)`: remove `troika-three-text` (dead — WebGLTextManager disabled); `tweakpane` → devDeps + dynamic import (absent from prod bundle); migrate `@studio-freight/lenis` → `lenis`; `import type * as THREE` in main-app
- `build(ci)`: fix broken workflow (`npm ci` → `bun install --frozen-lockfile`, YAML bug, add type-check + test + lint steps); rewrite `tests/e2e.spec.ts` (9 broken tests → 7 real); fix `projects/*.html` (broken entry paths + dead links)

**Sprint 2 — Performance**
- `perf`: `visibilitychange` pauses render loop on hidden tabs; lazy `KTX2Loader` (dynamic import — 622 KB transcoder no longer preloaded); particle counts gated by `DeviceCapability.tier`; `camera.shake` reduced-motion gated

**Sprint 3 — Render correctness**
- `fix(render)`: fix double ACES + triple sRGB encode (rtScene linear, single ACES in composite); `disposeMaterialDeep()` util (disposes material textures — was leaking VRAM); `SplashCube.dispose()` now called (was skipped); resize debounced 150ms; `prefers-reduced-motion` freezes decorative 3D anims; fix `bloomEnabled` default (`|| true` → `!_isWebGPU`)

**Sprint 5 — a11y + SEO**
- `feat(a11y,seo)`: skip-link `:focus` (WCAG 2.4.1); splash `role=status`/`aria-live`; `<noscript>` fallback; `ProjectOverlay` `role=dialog`/`aria-modal`/focus-trap/restore-focus/ESC; `cursor:none` scoped to `(hover: hover) and (pointer: fine)`; `og:*`/`twitter:*`/`canonical`/JSON-LD/`robots.txt`/`sitemap.xml`

**Sprint 4 — TS strict + lint + chunking**
- `chore(ts)`: enable `strict: true` (was missing despite README claim; 0 errors)
- `build`: migrate `manualChunks` → rolldown `codeSplitting` API (manualChunks was deprecated/ineffective under Vite 8); `vendor-three` isolated, lazy KTX2 not preloaded; critical preload ~570 KB → ~346 KB gzip (−40%)
- `chore(lint)`: ESLint 9 flat config + `typescript-eslint` + Prettier; `bun run lint` exits 0; CI gains Lint step
- `feat(seo)`: prerender 6 home sections into `index.html` at build time (crawlers see real content, not empty `<div id="app">`)

**Bug fixes (user-reported)**
- `fix(splash)`: eliminate title animation delay (fire `jlz:webgl-ready` at curtain mid-open, not +1150ms); rename `triggerPortalCollapse` → `reveal()` (vestigial portals name); `NoiseText.finalize()` strips span styles in place (no letter-spacing layout pop)
- `fix(works)`: remove `uk-scrollspy` from `#project-overlay` (caused 0.5s flash on section entry); `WorksPortfolio.goTo()` rounds float `currentIdx`; `next/prev` use `targetIdx` not lagging `currentIdx` (prev/next now works on all 4 projects with wrap-around)
- `fix(sections)`: junni-style CSS `scroll-snap-type: y mandatory`; fix `WorldConfig` ranges `/6` → `/5` (scroll limit = 5×vh); `BG.update` lerp `0.4` → `6.0` (was 2.5s lag); double-smoothstep for bg+group fade (holds section color until mid-transition — fixes about white-text contrast loss); `BG.ts` reads colors from `WorldConfig` (single source — was hardcoded + drifted); flexible section gains rotating wireframe icosahedron

**Verification**: `bun run lint` (0 errors, 14 warnings) · `bun run type-check` (strict, 0 errors) · `bun run build` (1.4s) · Agent Browser end-to-end (0 runtime errors).

## 2026-06-27

### Splash + scroll transitions + docs

- `c0ff818` feat: DrawTrail — fix cursor-to-world projection, trail now visible
- `16ad4ef` fix: remove Hermes hallucinated code — 569 lines of broken TypeScript
- `91f1bfc` fix: AUDIT A-002/A-006/A-007/A-009/A-010/A-015 — remaining items
- `f2ac5e2` fix: AUDIT A-001/A-003/A-004/A-005/A-008 — critical bugs + perf

Splash enhancements:
- Vignette (dark edges for depth)
- Scan lines (retro CRT, subtle)
- Curtain split with overshoot (more dramatic)
- All existing: gradient brand + shimmer + radial glow + film grain

Scroll transitions:
- Camera shake on section transition (0.04 power, 0.4s)
- Per-section cursor follow (works=0.22, others=0.15)
- Portrait FOV boost (up to +20°)
- All existing: camera lerp, BG continuous lerp, fog, lighting, post-processing


### Splash + scroll transitions + docs

- `c0ff818` feat: DrawTrail — fix cursor-to-world projection, trail now visible
- `16ad4ef` fix: remove Hermes hallucinated code — 569 lines of broken TypeScript
- `91f1bfc` fix: AUDIT A-002/A-006/A-007/A-009/A-010/A-015 — remaining items
- `f2ac5e2` fix: AUDIT A-001/A-003/A-004/A-005/A-008 — critical bugs + perf

Splash enhancements:
- Vignette (dark edges for depth)
- Scan lines (retro CRT, subtle)
- Curtain split with overshoot (more dramatic)
- All existing: gradient brand + shimmer + radial glow + film grain

Scroll transitions:
- Camera shake on section transition (0.04 power, 0.4s)
- Per-section cursor follow (works=0.22, others=0.15)
- Portrait FOV boost (up to +20°)
- All existing: camera lerp, BG continuous lerp, fog, lighting, post-processing

## 2026-06-26

### AUDIT complete + NoiseText + styles cleanup

- All AUDIT items A-001 through A-015 resolved
- NoiseText: junni typewriter reveal algorithm (was random scramble)
- WebGLTextManager disabled (was making titles transparent)
- Styles: single main.less, tokens.css deleted, sections.css merged
- Single Inter font (overrode master-quantum-flares Source Sans 3)
- Hermes hallucinated code removed (Stage4, WorksStack, Jólni — 569 lines)

## 2026-06-24

### 3D restore + performance + overlay fixes

- WebGPU direct render (bypass TSL pipeline)
- BakuTSLMaterial → MeshStandardMaterial
- setAnimationLoop (not rAF)
- alpha:false for WebGPURenderer
- NoiseText via jlz:section-change
- Works overlay: lazy init, pointer guard, reuse #project-overlay
- Styles cleanup: -1068 lines, tokens.css pure tokens (later deleted)
- Dead code removal: ~1900 lines, 28 files

## 2026-06-22

### 3D restore + performance (7 commits)

- Built-in materials only (no ShaderMaterial in scene)
- getTextureNode('output') for pass()
- Disable DrawTrail + WebGLTextManager (perf, later re-enabled/disabled)
- setAnimationLoop for WebGPU swap chain
