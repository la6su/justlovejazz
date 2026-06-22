# CHANGELOG

## 2026-06-22

### 3D restore + performance (7 commits)

- `7a6c15d` fix: restore 3D — built-in materials, getTextureNode, dissolve guard
  - Replaced all ShaderMaterial in SectionSceneFactory with built-in materials
  - Added getTextureNode('output') for pass() (was black screen on WebGPU)
  - Removed double renderOutput wrap
  - Skip DissolveOverlay on WebGPU (ShaderMaterial incompatible)
  - Fixed WebGPU renderer detection (isWebGPURenderer, not isWebGPU)
- `86fb90b` perf: BakuTSLMaterial → MeshStandardMaterial
  - TSL NodeMaterial with MaterialX noise was 3 FPS on Chrome WebGPU-over-ANGLE
- `3a8487a` fix: dissolveOverlay GLSL dot() args
  - dot() called with one arg → shader compile error
- `2bffc17` perf: WebGPU direct render — bypass TSL pipeline
  - TSL pipeline (pass→RT→QuadMesh) doubled GPU work; direct render is 60 FPS
- `b68eb92` perf: remove per-frame ShaderMaterial traverse
  - World.update traversed all scene groups every frame looking for uTime (no-op)
- `65e014f` perf: disable DrawTrail + WebGLTextManager
  - DrawTrail: 64-point geometry update every frame
  - WebGLTextManager: second WebGLRenderer (Troika) every frame

### Branch cleanup

- Synced `test` to `main` (was 17 commits behind)
- Deleted 8 merged feature branches

### Docs

- Updated STATUS.md, ARCHITECTURE.md, AGENTS.md, AUTONOMY.md
- Added HERMES_RULES.md (10 hard rules with bug provenance)
- Added ENVIRONMENT.md (Chrome/Wayland WebGPU issue + workarounds)

## 2026-06-20

- PR #55: loadCardTexture crash fix (modulo wrap + undefined guard)
- Bun migration complete
- DrawTrail added (later disabled for perf on 2026-06-22)

## Earlier

See `git log --oneline` for full history.
