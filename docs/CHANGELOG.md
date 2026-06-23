# CHANGELOG

## 2026-06-24

### 3D layer restore + overlay fix + docs (2 commits)

- `8d887a1` fix: restore 3D layer — Baku, transparent sections, non-destructive fade
  - Restored Baku (was empty stub)
  - Made section-bg transparent (3D canvas visible)
  - Non-destructive opacity fade (HERMES_RULES §3)
  - Restored tsl-utils.ts
  - Simplified Renderer, SectionSceneFactory, World.update
- `fix: works overlay — reuse #project-overlay, fix section ID`
  - ProjectOverlay reuses existing #project-overlay from templates.ts
  - Fixed: getElementById('section-works') → 'section-challenge'
  - Was: duplicate overlays (one empty, one with content)

### Docs overhaul

- Updated STATUS.md — current state, section layout, renderer architecture
- Updated ARCHITECTURE.md — layout pattern, modules, scroll→3D sync
- Updated HERMES_RULES.md — 15 rules (was 10), added:
  - §11 No duplicate overlay containers
  - §12 Match section IDs between templates and JS
  - §13 Never remove Baku
  - §14 Never make section-bg opaque
  - §15 Check junni reference first
- New JUNNI_REFERENCE.md — junni section compositions, patterns to port
- Updated AGENTS.md — 15 rules summary, section IDs to memorize
- Updated README.md — current stack, section table

## 2026-06-22

### 3D restore + performance (7 commits)

- `7a6c15d` fix: restore 3D — built-in materials, getTextureNode, dissolve guard
- `86fb90b` perf: BakuTSLMaterial → MeshStandardMaterial
- `3a8487a` fix: dissolveOverlay GLSL dot() args
- `2bffc17` perf: WebGPU direct render — bypass TSL pipeline
- `b68eb92` perf: remove per-frame ShaderMaterial traverse
- `65e014f` perf: disable DrawTrail + WebGLTextManager
- `5eee827` fix: restore junni-pattern 1:1 sections — remove lessons

### Branch cleanup

- Synced `test` to `main` multiple times
- Deleted 8+ merged feature branches

## 2026-06-20

- PR #55: loadCardTexture crash fix
- Bun migration complete

## Earlier

See `git log --oneline` for full history.
