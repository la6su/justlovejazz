# CHANGELOG

Recent activity. Use `git log` for full details. See `docs/STATUS.md`
for the canonical current state.

## 2026-06-17 — Junni-parity session (8 PRs merged into `test`)

| PR | Topic |
|----|-------|
| #1 | render-pipeline integrity: wire Renderer.resize to pipeline, pass delta-time to PostProcessingManager (was hardcoded 1/60), make ProjectOverlay hide event-driven (was per-frame), extract section-transition magic numbers |
| #3 | junni-parity foundation: JUNNI_PORT_BLUEPRINT doc, TSL shader library (sigmoid, snoise, hsv2rgb, gaussBlur5, acesTonemap), WebGPU TSL post-processing pipeline (was empty stub), per-section FOV/smoothing in WorldConfig, design token system (tokens.css + tokens.less) |
| #5 | mip-chain bloom via three/addons BloomNode (replaces single-pass applySoftGlow), TSL adapter hardening (remove broken sampleMipBlend — API renamed to tex.level), RenderPipeline init order fix (was created before renderer.init()), splash + EnterButton migrated to tokens |
| #7 | docs-drift fix (SPA reality, entry-shell.ts, Contact not impl), resize listener leaks fixed (Sizes/Renderer/Camera/Input — all had anonymous-arrow listeners), splash ARIA roles + aria-valuenow sync, Camera prefers-reduced-motion compliance |
| #8 | WebGPU/WebGL parity: chromatic aberration added to WebGPU path (was WebGL-only), Input.ts listener leak fix |

**Net effect**: WebGPU primary path now has full post-processing parity
with WebGL (bloom + chromatic + grain + vignette + ACES tonemap). All
window listeners clean up on destroy (no HMR leaks). Docs match code.

## 2026-05-12 — Pre-session baseline

| Date | Summary |
|------|---------|
| 2026-05-12 | Refactor docs: consolidate MD files into `docs/` |
| 2026-05-12 | Fix: gallery visibility + modal open/close pipeline |
| 2026-05-12 | Fix: call Experience.init() — renderer loop never started |
| 2026-05-12 | D1: gallery expand/contract pipeline overhaul |
| 2026-05-12 | Fix: remove invalid transpile option from vite.config.ts |
| 2026-05-07 | TS build blocker in AssetManager.ts (BicubicFilter types) |
| 2026-05-07 | Renderer fallback UI + cinematic error screen |
| 2026-05-07 | Post-processing pipeline via WorldState TSL uniforms |
| 2026-05-07 | Wired WorldConfig.ui.showGallery to WorldState and DOM |
| 2026-05-07 | Reshaped WorldConfig into typed presets |
| 2026-05-07 | Normalized smooth scroll to stable 0..1 range |
| 2026-05-07 | Removed debug scene, added WebGPU capability state |
| 2026-05-07 | GPUResourceManager + DeviceCapability system |
| 2026-05-07 | Experience Transformation: NarrativePhase, relative camera tracking |
