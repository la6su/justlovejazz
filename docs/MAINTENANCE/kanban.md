# Kanban Board — justlovejazz

## DONE

### EPIC: Re-enable DrawTrail (DrawTrail.ts → World)
- [x] T-001: Изучить текущий DrawTrail.ts — понять внутренности работы
- [x] T-002: Проанализировать причину отключения (DrawTrail.perf budget)
- [x] T-003: Оптимизировать DrawTrail geometry update (batch 64 points → GPU buffer)
- [x] T-004: Интегрировать DrawTrail с Points + friendly buffer update
- [x] T-005: Интегрировать DrawTrail в World.ts (re-enable in constructor + update loop)
- [x] T-006: Верификация: type-check ✅ + build ✅ + browser ✅ (faint blue trail following cursor)

### EPIC: Junni reference repo cloned
- [x] Clone junni repo into `references/next.junni.co.jp/`
- [x] Properly gitignore nested `.git/` history

## TODO

### EPIC: WebGLTextManager re-enable (Troika / second-pass text overlay)
- [ ] T-040: Проанализировать WebGLTextManager.ts (reason for disable)
- [ ] T-041: Создать safe WebGL rendering mode (DOM + WebGL hybrid)
- [ ] T-042: Верификация: type-check + build + browser text visible

### EPIC: Holographic UI panels (Comrades / Displays) — styled references
- [ ] T-050: Изучить Section3/Displays в Junni
- [ ] T-051: Создать holographic display panel component
- [ ] T-052: Интегрировать в Canvas/UI overlay system
- [ ] T-053: Восстановить Scene3 index pattern

### EPIC: SecurityMaterials / interactive lighting upgrades
- [ ] T-060: Recreate Junni CursorLight Material interaction
- [ ] T-061: Upgrade DrawTrail to GPU-compute trail node
- [ ] T-062: Test WebGL2/next3 integration with texture passes
- [ ] T-063: Verify on browser (cursor light + trail + holographic panel OK)
