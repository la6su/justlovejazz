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
  - Итог: Troika конфликтует с NoiseText (делает textContent невидимым).
    WebGLTextManager снова отключён. jlz:webgl-ready диспатчится сразу.

### EPIC: Junni reference repo cloned
- [x] Clone next.junni.co.jp → references/next.junni.co.jp/
- [x] .gitignore для .git в references

### EPIC: CursorLight (T-003) — ALREADY ACTIVE
- [x] CursorLight в World.ts, подключен и работает.

### EPIC: NoiseText (T-004) — ALREADY ACTIVE
- [x] NoiseText в entry-app.ts + Subtitles.ts, подключен и работает.

### EPIC: Critical bug fixes (2026-06-26)
- [x] T-060: PostProcessingManager — ключи пресетов step01..step08 → sec_intro..sec_contact
  (applyPreset(cfg.id) теперь реально находит пресет, постобработка per-section работает)
- [x] T-061: NarrativePhase enum — STEP01..STEP08 → INTRO..CONTACT, синхронизировано
  с WorldConfig.id и PostProcessingManager ключами
- [x] T-062: Baku.applyRoleAndParams — убран GPU memory leak: новый материал создавался
  каждый кадр; теперь swap только при смене типа (instanceof check)
- [x] T-063: Experience._runProjectDissolve — requestAnimationFrame → StateBus.animate
  (соблюдение HERMES_RULES §4 / §19)
- [x] T-064: WorldAtmosphere — удалены мёртвые initBG/initFog, dispose не обнуляет
  scene.background (соблюдение HERMES_RULES §5 / §21)
- [x] T-065: entry-app.ts — удалены setTimeout(animateNoiseTitles, 500/2000/5000) и
  throttled scroll listener; единственный триггер — jlz:webgl-ready + jlz:section-change
  (соблюдение HERMES_RULES §10 / §19)
- [x] T-066: Документация — HERMES_RULES +5 правил (18-21), STATUS.md актуализирован,
  kanban обновлён

### EPIC: Quality pass (2026-06-26 — сессия 2)
- [x] T-067: BG.ts — добавлен setProgress(fromIndex, toIndex, t) для плавного
  pixel-perfect lerp фона при скролле между секциями (был snap по индексу секции)
- [x] T-068: World.ts — updateTransform вызывает bg.setProgress вместо bg.setSection
- [x] T-069: Input.ts — scroll smoothing переведён с фиксированного lerpFactor=0.35
  на framerate-independent exponential decay (smoothHalfLife=0.18s)
- [x] T-070: Camera.ts — исправлен баг: shakeTime/shakePower не сбрасывались после
  окончания shake-анимации; добавлен сброс shakeTime=0 по завершению

### EPIC: Section content + perf (2026-06-26 — сессия 3)
- [x] T-071: SectionSceneFactory — все 6 секций получили уникальную геометрию
  по junni-паттернам: crosses, line-ring, grid, torus, dots, slashes, constellation,
  perspective road. Только built-in materials (HERMES_RULES §1).
- [x] T-072: Section.update — mesh cache: traverse() заменён на разовый сбор в
  _cachedMeshes при первом вызове. Emissive pulse теперь O(n) без traverse per frame.
- [x] T-073: CursorLight — убрана Vector3.clone() на каждый update(); заменена на
  subVectors + addScaledVector (zero-alloc spring-damper).

### EPIC: World Environment Architecture (2026-06-26 — сессия 4)
- [x] T-074: Lights.ts — полная переписка по junni changeSection() паттерну.
  setMood(warmth=scrollProgress) удалён. Теперь SECTION_PRESETS[cfg.id] с per-section
  цветами key/fill/rim/hemi/volumetric. Lights lerp к новым значениям за ~0.5s.
- [x] T-075: World.updateTransform() — при смене fromIndex вызывает
  lightsGroup.changeSection(cfg) + atmosphere.setFog(). Junni: atmosphere matches section.
- [x] T-076: World.init() — snap lights + fog к первой секции при инициализации.
- [x] T-077: World.update() — traverse() по sceneGroups заменён на cached Points refs
  (_particleCache в userData). Particle drift O(n pts) без traverse per frame.
- [x] T-078: Experience.ts — удалён setMood(warmth, envIntensity), удалён fog из
  context-change блока. Lights/fog теперь полностью управляется из World.
- [x] T-079: SectionSceneFactory — добавлен hideGeometry(group), вызывается в World.init().
  Все не-particle объекты скрыты (visible=false) до появления bespoke визуала.

## TODO

### EPIC: AUDIT fixes (docs/AUDIT.md — priority order)
- [ ] A-003: Section.switchState() — fix animation bug (bus.channel overwrites current value)
- [ ] A-001: World.resize() — implement propagation to sceneGroups + groundPlane
- [ ] A-004: Wire world.resize() from Experience Sizes listener
- [ ] A-002: Portrait FOV — add portraitFovBoost to PhaseConfig + Camera.updateSmooth()
- [ ] A-008: Section.setMeshOpacity() — reuse _cachedMeshes (lazy-init if null)
- [ ] A-009: Baku worldState.bakuMaterial → baku.updateMaterial() connection in World
- [ ] A-005: Baku role caching — _currentRole field, skip applyRoleAndParams when unchanged
- [ ] A-006: Double traverse in updateTransform — _meshCache in sceneGroups userData
- [ ] A-007: DrawTrail per-section re-enable + visibility gating (sec_about, sec_flexible)
- [ ] A-015: Per-section cursor follow strength (cursorFollowStrength in PhaseConfig)

### EPIC: Holographic UI Panels (T-050)
- [ ] T-050: Displays panel — interactive holographic UI
- [ ] T-051: Comrades panel — multi-character display
- [ ] T-052: Type-check + build
- [ ] T-053: Git push

### EPIC: Bespoke 3D section content
- [ ] T-070: Section 0 (Intro) — white BG hero object (replaces Baku placeholder)
- [ ] T-071: Section 1 (About) — dark BG blob / reflective floor
- [ ] T-072: Section 2 (Flexible) — light transition object
- [ ] T-073: Section 4 (Innovative) — constellation/network graph
- [ ] T-074: Section 5 (Contact) — closing visual

### EPIC: DrawTrail re-enable
- [ ] T-080: Profiling budget — confirm DrawTrail fits within 60 FPS target
- [ ] T-081: Uncomment DrawTrail in World.ts + smoke-test
