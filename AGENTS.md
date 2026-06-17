# AGENTS.md

## Purpose

This file is the shared instruction layer for any LLM agent working on this repository:

- Codex;
- Hermes 4 via llama.cpp;
- local IDE agents;
- future automation agents.

Instructions must stay cross-platform and model-agnostic. Do not add rules that only one agent runtime can understand.

## Language

- User-facing responses: Russian.
- Code, identifiers, file names, commit messages: English.
- Technical comments: English, short, only when useful.
- Plans and documentation may be Russian unless the file is explicitly English.

## Project Goal

Bring `justlovejazz` to a production-level interactive studio portfolio inspired by `next.junni.co.jp`, using this project stack:

- Vite;
- TypeScript strict;
- Three.js;
- Three.js TSL / Nodes;
- WebGPU primary;
- explicit WebGL/fallback policy;
- UIkit 3 + Less;
- Lenis.

Do not copy Junni assets, text, models, SVGs, or content. Port patterns, not copyrighted content.

## Main References

Read these files before large changes (in priority order):

1. `docs/STATUS.md` ⭐ — canonical current state; if other docs conflict, STATUS wins
2. `docs/JUNNI_PORT_BLUEPRINT.md` — junni → modern stack port map + acceptance criteria
3. `README.md` — overview + run commands
4. `docs/SPEC.md` — technical specification (renderer contract, scenes, motion rules)
5. `docs/ARCHITECTURE.md` — module responsibilities + entry/runtime map
6. `docs/AUTONOMY.md` — LLM agent operating protocol
7. `docs/LAZY_LOADING.md` — bundle split strategy

**Junni reference repo is PUBLIC**: `junni-inc/next.junni.co.jp` on GitHub
(Gulp + three 0.145, 2022). Port patterns, do not copy assets/content.

## Current Priority

Build is stable (type-check + build green). Core tracks 1–5 from
JUNNI_PORT_BLUEPRINT are done. See `docs/STATUS.md` for the live state.

Immediate priorities (in order):

1. **Track 6 bespoke content** — 3D assets, Baku model, per-page copy.
   Requires human creative direction; cannot be code-generated.
2. **Track B per-section bloom tuning** — design review of bloomRadius
   + bloomThreshold per RawScene in WorldConfig.
3. **Playwright E2E expansion** — route smoke, works lifecycle, keyboard nav.
4. **Lighthouse on real hardware** — perf ≥ 85, a11y ≥ 90.
5. Any regression or new defect found in `docs/STATUS.md` audit.

For autonomous local LLM work, follow `docs/AUTONOMY.md`.

## Engineering Rules

- Keep changes small and scoped.
- Prefer existing architecture over new abstractions.
- Do not disable strict TypeScript checks to hide errors.
- Do not add dependencies without a clear reason.
- Do not add global mutable state unless it is already part of a local pattern and justified.
- Avoid `any`; if needed, isolate it behind a typed adapter.
- Do not create objects, vectors, materials, or geometries inside hot loops without a reason.
- Dispose textures, geometries, materials, event listeners, and render targets explicitly.
- Do not remove user changes or unrelated files.

## Three.js / TSL Rules

- WebGPU is the primary rendering path.
- WebGL support must be explicit: implemented fallback or clear unsupported state.
- Keep WebGPU-specific APIs isolated (adapter boundary `any` only in
  `RenderPipeline.ts` for the native RenderPipeline constructor).
- Use TSL method chaining where possible: `.add()`, `.mul()`, `.sub()`.
- Keep shader helpers in `src/shaders/tsl-utils.ts`.
- TSL version assumptions are documented in the header of `tsl-utils.ts`
  — verify against `node_modules/three/src/nodes/` on three upgrades.
- Expensive shader features need quality-tier control.
- Do not mix GLSL string shaders and TSL in the same material without an adapter.
- Post-processing pipeline is production-grade: WebGPU uses
  `three/addons/tsl/display/BloomNode` (mip-chain); WebGL uses custom
  ShaderMaterial pipeline. Both have parity (bloom, chromatic, grain, vignette).

## UX / Motion Rules

- Motion must be state-driven and delta-time aware.
- Avoid linear visual movement.
- Camera should have clear base transform and final transform.
- Mobile must use reduced movement, not a scaled desktop feel.
- Support `prefers-reduced-motion` — enforced in Camera, SmoothScroll,
  GalleryManager, World, and tokens.css (transitions disabled).
- DOM and WebGL must use the same application state.
- No hover-only critical interactions.

## Styling Rules

- Design tokens live in `src/styles/tokens.css` (CSS custom properties)
  with a Less bridge in `src/styles/tokens.less`.
- All new UI must use `--jlz-*` tokens — no hardcoded colors, sizes,
  durations, or easings in component code.
- Component classes go in `tokens.css` under a "Component styles" section.
- Inline `style=` attributes are allowed ONLY for dynamic values (e.g.
  per-frame transform, per-project accent color). Static styling → class.
- UIkit 3 + Less variables are bridged via `@jlz-*` in `tokens.less`.

## Lifecycle Rules

- Any module registering a `window.addEventListener` MUST expose a
  `destroy()` (or `dispose()`) that calls `removeEventListener` with the
  SAME bound handler ref (anonymous arrows cannot be removed).
- `Experience.destroy()` MUST call destroy/dispose on every owned module:
  Sizes, Renderer, Camera, Input, SmoothScroll, ContentReveal, Cursor,
  World, StateBus, DebugStats, Portfolio, Overlay.
- Vite HMR triggers destroy on module replacement — leaks surface fast
  in dev. If a listener can't be cleaned up, fix it before merging.

## Asset Rules

- Use an asset manifest for new asset loading.
- Prefer KTX2/Basis for GPU textures.
- Prefer AVIF/WebP for UI/content images.
- Do not dispose assets randomly.
- Dispose only inactive contexts and only after references are released.
- Keep first-frame critical assets small.

## Cross-Platform Command Rules

Prefer npm scripts over shell-specific commands:

```bash
npm run build
npm run dev
npm run preview
```

Avoid instructions that require only one shell:

- no Bash-only process substitution;
- no shell-specific glob assumptions;
- no OS-specific absolute paths in docs;
- no commands that only work on macOS/Linux/Windows unless clearly labelled.

When adding scripts to `package.json`, make them work on macOS, Linux, and Windows.

## File Editing Rules

- Use UTF-8.
- Preserve existing file style.
- Use LF line endings for repository files.
- Do not reformat unrelated files.
- Do not commit generated folders such as `dist`.
- Do not commit `.DS_Store`, logs, local caches, or machine-specific files.

## Verification

For code changes, run the smallest relevant verification first.

Baseline gates:

```bash
npm run build
```

When available:

```bash
npm run type-check
npm run lint
```

If verification cannot be run, state why and list the expected risk.

## Git Rules

- Keep commits focused.
- Commit documentation separately from code when practical.
- Do not revert unrelated user changes.
- Do not stage unrelated dirty files.
- Commit message format:

```text
type: short imperative summary
```

Examples:

```text
docs: add cross-platform agent instructions
fix: stabilize renderer capability detection
refactor: isolate gallery detail state
```

## Output Style For Agents

When responding to the user:

- answer in Russian;
- be concise;
- say what changed;
- say what was verified;
- mention blockers directly;
- avoid long theoretical explanations unless requested.

## Production Bar

A feature is not production-ready until:

- build passes;
- behavior is tested on desktop and mobile;
- fallback behavior is defined;
- memory lifecycle is clear;
- accessibility baseline is respected;
- documentation matches implementation.
