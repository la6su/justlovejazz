# Kanban Board — justlovejazz

## ✅ DONE

### EPIC: Re-enable DrawTrail
- [x] T-001: Изучить DrawTrail.ts → интеграция в World.ts + update loop
- [x] T-002: Проанализировать perf budget → решаемо, retained 64-point buffer
- [x] T-003: Интегрировать DrawTrail в World.ts (re-enable) + type-check
- [x] T-004: Git push

### EPIC: Re-enable WebGLTextManager (T-040)
- [x] T-040: Проанализировать WebGLTextManager.ts (причина отключения — perf)
- [x] T-041: Восстановить ensureWebGLTextManager с dynamic import + DOM guard
- [x] T-042: type-check + build + git push
  - Патч: Experience.ts — ensureWebGLTextManager() вместо return → real WebGLTextManager init
  - Troika overlay rendering .studio-title on transparent canvas, synced with update()

### EPIC: Junni reference repo cloned
- [x] Clone next.junni.co.jp → references/next.junni.co.jp/
- [x] .gitignore для .git в references

### EPIC: CursorLight (T-003) — ALREADY ACTIVE
- [x] T-003: Var CursorLight в World.ts, подключен и работает. Код: DirectionalLight с spring-damper по курсору — Junni pattern

### EPIC: NoiseText (T-004) — ALREADY ACTIVE
- [x] T-004: NoiseText в entry-app.ts + Subtitles.ts, подключен и работает.

## TODO

### EPIC: Holographic UI Panels (T-050)
- [ ] T-050: Displays panel — interactive holographic UI (прищелк по '.')
- [ ] T-051: Comrades panel — multi-character display
- [ ] T-052: Type-check + build
- [ ] T-053: Git push
