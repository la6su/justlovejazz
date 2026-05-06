# DEVELOPMENT_PLAN.md

## Цель

Довести `justlovejazz` до production-уровня интерактивного studio portfolio. План ниже намеренно проверяемый: каждая задача имеет результат, файл/зону работ и gate.

## Current State

Готовая база:

- `src/core/Bootstrapper.ts` запускает приложение по шагам;
- `src/Experience/Experience.ts` держит render loop и оркестрацию;
- `src/core/CameraStateManager.ts` связывает scroll с camera/world state;
- `src/core/WorldConfig.ts` задаёт section presets;
- `src/Experience/World/GalleryScene.ts` строит gallery planes;
- `src/shaders/postprocessing.tsl.ts` содержит базовый TSL post node;
- `src/core/AssetManager.ts` умеет грузить обычные textures и KTX2.

Риски:

- `npm run build` на 2026-05-06 падает на TS errors;
- `Renderer` сейчас типизирован как `WebGPURenderer`; fallback только заявлен;
- post-processing не является полноценным multi-pass pipeline;
- `AssetManager.purgeUnused()` может удалить textures, которые ещё используются mesh/material;
- scroll нормализуется через `/ 1000`, а не через реальную длину документа;
- нет automated QA: type-check script, lint, visual/perf tests.

Текущие build blockers:

- unused imports/params при `noUnusedLocals`;
- `ProjectGrid` вызывает методы, которых нет в `UIManager`;
- `ProjectUISync` ожидает `GalleryManager.onStateChange`, которого нет;
- TSL API drift: `toVec3`, `vec2(Node<vec2>)`, `.add()` на numeric literal;
- `postprocessing.tsl.ts` требует адаптации под актуальные Three.js TSL types.

## Phase 1: Реальная Базовая Надёжность

- [ ] Добавить `npm run type-check`.
  - Файлы: `package.json`.
  - Gate: `npm run type-check` проходит отдельно от build.

- [ ] Исправить renderer contract.
  - Файлы: `src/Experience/Renderer.ts`, `src/types`.
  - Результат: явная стратегия `webgpu | webgl | unsupported`.
  - Gate: приложение показывает понятный fallback/error screen.

- [ ] Нормализовать scroll progress.
  - Файлы: `src/Experience/Input.ts`, `src/Experience/SmoothScroll.ts`, `src/core/CameraStateManager.ts`.
  - Результат: progress всегда `0..1`, независимо от высоты страницы.
  - Gate: все секции достижимы на desktop/mobile.

- [ ] Убрать случайный runtime purge.
  - Файлы: `src/Experience/World/GalleryScene.ts`, `src/core/AssetManager.ts`.
  - Результат: assets освобождаются по state/context, не через `Math.random()`.
  - Gate: нет пропадающих текстур при быстром carousel/detail переходе.

## Phase 2: Junni-Level World System

- [ ] Расширить `WorldConfig`.
  - Добавить: `scrollRange`, `camera`, `baku`, `lighting`, `post`, `ui`.
  - Gate: секция полностью описывается конфигом, без hardcode в update.

- [ ] Разделить world sections.
  - Файлы: `src/Experience/World/Section.ts`, новые section modules.
  - Результат: `HOME`, `WORKS`, `ABOUT`, `CONTACT` имеют отдельные update hooks.
  - Gate: добавление новой секции не требует править `Experience.update()`.

- [ ] Довести `Baku` до role-object.
  - Файлы: `src/Experience/World/Baku.ts`, `src/shaders`.
  - Результат: материал, scale, rotation, distortions и visibility управляются state.
  - Gate: каждый section preset визуально различим без DOM.

## Phase 3: Render Pipeline

- [ ] Спроектировать production post stack.
  - Порядок: scene -> SMAA/AA -> bloom bright -> mip blur -> composite -> grain -> vignette.
  - Файлы: `src/Experience/Renderer.ts`, `src/shaders/postprocessing.tsl.ts`, новые pipeline helpers.
  - Gate: можно отключать каждый pass через debug config.

- [ ] Multi-layer bloom.
  - Использовать mip pyramid, не один soft-glow sample.
  - Gate: glow не мылит всю сцену и не убивает typography contrast.

- [ ] Bicubic/detail sampling для project textures.
  - Файлы: `src/shaders/ProjectMaterial.ts`, `src/shaders/tsl-utils.ts`.
  - Gate: fullscreen zoom не выглядит пиксельным на DPR 2.

- [ ] Quality tiers.
  - `high`: WebGPU + full post.
  - `medium`: WebGPU/WebGL + reduced bloom.
  - `low`: no expensive passes, capped DPR.
  - Gate: tier выбирается автоматически и логируется один раз.

## Phase 4: Asset Pipeline

- [ ] Завести asset manifest.
  - Поля: `id`, `url`, `type`, `priority`, `context`, `size`, `fallback`.
  - Gate: загрузка не зависит от строк, разбросанных по компонентам.

- [ ] Конвертировать raster assets.
  - UI/images: AVIF/WebP.
  - GPU textures: KTX2/Basis.
  - Gate: нет тяжёлых JPG/PNG в critical path без причины.

- [ ] Ввести lifecycle.
  - `preload`, `activateContext`, `deactivateContext`, `disposeContext`.
  - Gate: Chrome Memory не показывает устойчивого роста после 20 переходов.

## Phase 5: UX / UI Polish

- [ ] Пересобрать layout как studio interface.
  - Файлы: `src/assets/main.less`, `src/UI`.
  - Gate: нет hero-маркетинга; первый экран уже является experience.

- [ ] Project detail.
  - Результат: fullscreen project state, back navigation, keyboard escape.
  - Gate: DOM и WebGL переходят синхронно.

- [ ] Mobile-first cinematic version.
  - Результат: touch inertia, vertical works flow, reduced camera movement.
  - Gate: нет hover-only функций.

- [ ] Accessibility layer.
  - Prefers reduced motion.
  - Keyboard navigation.
  - Focus states.
  - Gate: Lighthouse Accessibility >= 90.

## Phase 6: Production QA

- [ ] Добавить debug HUD только для dev.
  - FPS, DPR, renderer mode, memory estimate, active section, quality tier.

- [ ] Visual regression.
  - Desktop: 1440x900.
  - Mobile: 390x844.
  - Gate: screenshots без blank canvas/overlaps.

- [ ] Performance budget.
  - JS initial <= 250 KB gzip target после оптимизации.
  - Textures critical <= 2 MB.
  - Stable 60 FPS desktop, >= 45 FPS mid mobile.

- [ ] Release checklist.
  - Build.
  - Preview.
  - Lighthouse.
  - Manual motion review.
  - Memory leak pass.

## Ближайший Рабочий Спринт

1. Исправить текущие TS ошибки до зелёного `npm run build`.
2. Добавить отдельный `type-check` script.
3. Сделать честный renderer fallback contract.
4. Исправить scroll normalization.
5. Убрать random purge.
6. После этого переходить к render pipeline.
