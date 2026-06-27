# CHANGELOG

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
