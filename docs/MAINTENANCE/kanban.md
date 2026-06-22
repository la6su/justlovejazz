# Kanban Board — justlovejazz

## DONE

### EPIC: Re-enable DrawTrail (DrawTrail.ts → World)
- [x] T-001: Изучить текущий DrawTrail.ts — понять внутренности работы
- [x] T-002: Проанализировать причину отключения (DrawTrail.perf budget)
- [x] T-003: Оптимизировать DrawTrail geometry update (batch 64 points → GPU buffer)
- [x] T-004: Интегрировать DrawTrail с Points + friendly buffer update
- [x] T-005: Интегрировать DrawTrail в Experience.ts (re-enable flag)
- [x] T-006: Верификация: type-check PASS + build PASS + browser ✅
  - DrawTrail re-enabled и работает! Видна faint blue trail following cursor
  - Details: LineBasicMaterial — WebGPU compatible, AdditiveBlending, 64-point buffer

## TODO

### EPIC: CursorLight (junni pattern port)
- [ ] T-010: Изучить junni CursorLight — как работает в оригинале
- [ ] T-011: Создать CursorLight.ts — spotlight following mouse cursor in 3D
- [ ] T-012: Подключить CursorLight к World module (CinematicLights integration)
- [ ] T-013: Добавить prefers-reduced-motion guard для accessibility
- [ ] T-014: Верификация: type-check + build + browser light follows cursor

### EPIC: WebGLTextManager re-enable (Troika text overlay)
- [ ] T-020: Изучить WebGLTextManager.ts — понять подсистему (Troika overlay)
- [ ] T-021: Оптимизировать second WebGLRenderer — batch text renders
- [ ] T-022: Create text rendering mode toggle (DOM fallback vs Troika)
- [ ] T-023: Интегрировать WebGLTextManager в Experience (guarded re-enable)
- [ ] T-024: Верификация: type-check + build + browser text visible + no perf drop

### EPIC: NoiseText (junni pattern port)
- [ ] T-030: Изучить junni NoiseText — как работает в оригинале
- [ ] T-031: Создать NoiseText.ts — text scramble effect with built-in materials
- [ ] T-032: Подключить NoiseText к ContentReveal.ts / Section transitions
- [ ] T-033: Адаптировать for prefers-reduced-motion
- [ ] T-034: Верификация: type-check + build + browser text effect visible
