# CHANGELOG

## 2026-06-24

### Font + NoiseText + overlay fixes

- `7fd37d3` fix: single Inter font + NoiseText via section-change event
  - Override master-quantum-flares 'Source Sans 3' with Inter
  - Hero title: weight 900, letter-spacing -0.03em (was 400, 0.05em)
  - NoiseText: jlz:section-change trigger (not IntersectionObserver)
  - NoiseText: intensity 60% (was 30%), duration 1.5s
- `a2321b3` fix: single Inter font + NoiseText scroll-spy timing
- `f5bbda8` fix: NoiseText + overlay — root cause fixes for all 3 issues
- `2725de8` fix: NoiseText scroll-spy + overlay hidden on non-works
- `d6b90a2` feat: scroll-spy NoiseText + cinematic splash enhancements
- `484c0dd` refactor: styles cleanup — -1068 lines, tokens.css pure tokens
- `4dd1645` audit: P0 bug fixes + P1 dead code removal (~1900 lines)
- `97e9948` fix: remove all 3D objects, fix floor glitch, restore NoiseText
- `8d887a1` fix: restore 3D layer — Baku, transparent sections, non-destructive fade
- `5eee827` fix: restore junni-pattern 1:1 sections — remove lessons, fix nav

### Docs overhaul
- HERMES_RULES.md: 17 rules (fonts, NoiseText trigger, overlay guard, etc.)
- STATUS.md, ARCHITECTURE.md, AGENTS.md updated
- JUNNI_REFERENCE.md added

## 2026-06-22

### 3D restore + performance
- WebGPU direct render (bypass TSL pipeline)
- BakuTSLMaterial → MeshStandardMaterial
- Disable DrawTrail + WebGLTextManager (perf)
- setAnimationLoop (not rAF)
- alpha:false for WebGPURenderer
- getTextureNode('output') for pass()
