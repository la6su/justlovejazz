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

## TODO

### EPIC: CursorLight (Junni Section3 pattern)
- [ ] Проанализировать CursorLight в Junni
- [ ] Портировать в src/Experience/World/CursorLight.ts
- [ ] Интегрировать в World.ts + type-check + push
