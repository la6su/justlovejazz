# PRO_ROADMAP.md

## North Star

Референс: [junni-inc/next.junni.co.jp](https://github.com/junni-inc/next.junni.co.jp).
Цель: не копия Junni, а сопоставимый уровень инженерии, движения, визуальной дисциплины и production QA.

## Studio Standard

Production-ready означает:

- есть измеримый performance budget;
- есть fallback strategy;
- все transitions state-driven;
- assets грузятся по приоритетам и освобождаются по lifecycle;
- WebGL/WebGPU поведение не расходится концептуально;
- mobile версия не является уменьшенной desktop версией;
- motion review проходит покадрово.

## Roadmap

### Phase 0: Truth Pass

- [x] Зафиксировать реальный текущий статус.
- [x] Убрать иллюзорные формулировки из документации.
- [x] Запустить build и записать текущие ошибки как backlog.
- [x] Исправить TypeScript build blockers.
- [ ] Добавить `type-check` script.

### Phase 1: Engine Reliability

- [x] Renderer mode detection: `webgpu`, `webgl`, `unsupported`.
- [ ] WebGL fallback или честная unsupported-страница, если TSL path невозможен.
- [x] DPR policy: desktop max 2, mobile max 1.5, low tier max 1.
- [x] Resize lifecycle без дублирования listeners.
- [x] Dispose lifecycle для renderer/world/UI.

### Phase 2: Camera / World Choreography

- [x] `WorldConfig` как единый источник camera, object, light, post и UI state.
- [x] Section timeline с `start`, `end`, `progress`.
- [x] Camera controller: base transform, delayed cursor, FOV impulse, shake.
- [ ] `Baku` role states: normal, glass, line, dark, project-focus.
- [ ] Project detail transition: gallery plane -> fullscreen -> detail UI.

### Phase 3: Render Fidelity

- [ ] Реальный multi-pass pipeline.
- [ ] SMAA или production-grade alternative для текущего renderer path.
- [ ] Bloom mip pyramid.
- [x] Grain/vignette/composite с параметрами по section.
- [x] Bicubic/detail sampling для fullscreen project textures.
- [ ] Debug toggles для каждого pass.

### Phase 4: Asset Orchestration

- [ ] Asset manifest с priority: `pre`, `must`, `sub`.
- [ ] KTX2 для GPU textures.
- [ ] AVIF/WebP для UI/content images.
- [ ] Lazy project detail assets.
- [x] Context disposal без удаления активных ресурсов.

### Phase 5: Studio UI

- [ ] Оптическая сетка: desktop/tablet/mobile отдельно.
- [ ] Typography reveal без layout shift.
- [ ] Keyboard navigation.
- [ ] Reduced motion mode.
- [ ] Accessible project detail.
- [ ] Loading sequence с честным progress.

### Phase 6: QA / Release

- [ ] `npm run build`.
- [ ] Lighthouse Performance >= 85.
- [ ] Lighthouse Accessibility >= 90.
- [ ] Chrome Performance profile: no long tasks > 100 ms в steady state.
- [ ] Memory: нет роста после 20 переходов gallery/detail.
- [ ] Visual screenshots: desktop + mobile.
- [ ] Manual motion review.

## Приоритеты

1. Надёжность runtime.
2. Честный fallback.
3. Камера и world timeline.
4. Asset lifecycle.
5. Render pipeline.
6. UI polish.

Render pipeline нельзя делать раньше runtime/fallback/lifecycle: иначе polish будет построен на нестабильной основе.
