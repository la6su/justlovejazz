# JUNNI_LEVEL_IMPLEMENTATION_PLAN.md

## Цель

Довести `justlovejazz` до уровня `next.junni.co.jp`, но на нашем новом стеке:

- Vite;
- TypeScript strict;
- Three.js `0.184+`;
- Three.js TSL / Nodes;
- WebGPU primary;
- WebGL/fallback policy;
- UIkit 3 + Less;
- Lenis;
- custom asset/render/world orchestration.

Цель не копировать Junni. Цель перенести их production-паттерны в нашу архитектуру.

## Что Берём Из Junni

- `MainScene` как единый runtime-layer.
- `CameraController`: base camera, delayed cursor, FOV impulse, organic shake.
- `World`: секции как stateful сцены.
- `Baku`: центральный объект с role/material states.
- `AssetManager`: приоритеты загрузки `pre`, `must`, `sub`.
- `RenderPipeline`: отдельные passes, а не один визуальный фильтр.
- `NoiseText` и staged text reveal как редкие акценты.
- Scroll-driven choreography: scroll управляет сценой, а не просто DOM.

## Что Не Берём

- Gulp/Webpack legacy pipeline.
- ORE/power-mesh как прямую зависимость.
- GLSL-first архитектуру.
- Junni assets, модели, тексты, SVG, контент.
- Логику через globals вроде `window.gManager`.

## Current State

Уже есть:

- `Bootstrapper`;
- `Experience` render loop;
- `Renderer` на `WebGPURenderer`;
- `Camera` с delayed cursor, FOV offset, shake;
- `CameraStateManager`;
- `WorldConfig`;
- `Baku`;
- `GalleryScene`;
- TSL shaders;
- `AssetManager` с KTX2 loader.

Блокеры:

- `npm run build` сейчас падает;
- WebGL fallback только заявлен;
- TSL API местами не совпадает с актуальными types;
- assets не описаны manifest-файлом;
- random `purgeUnused()` может удалить активные textures;
- нет debug HUD, perf budget, visual QA.

## Phase 1: Stabilize Build

Цель: получить зелёный build без отключения strict checks.

### 1.1 TypeScript Cleanup

Файлы:

- `src/core/Bootstrapper.ts`
- `src/core/CameraStateManager.ts`
- `src/core/GalleryManager.ts`
- `src/Experience/Experience.ts`
- `src/Experience/World/GalleryScene.ts`
- `src/main.ts`
- `src/UI/*`
- `src/shaders/*`

Действия:

- удалить unused imports/params;
- привести `ProjectGrid` и `UIManager` к одному API;
- добавить или убрать `GalleryManager.onStateChange`;
- исправить TSL nodes под актуальный Three.js API;
- убрать `any` там, где можно заменить локальными interfaces.

Gate:

```bash
npm run build
```

## Phase 2: Renderer Contract

Цель: честная runtime-стратегия вместо декларации “WebGPU -> WebGL”.

### 2.1 Renderer Capabilities

Добавить:

```ts
export type RendererMode = 'webgpu' | 'webgl' | 'unsupported'
export type QualityTier = 'high' | 'medium' | 'low'
```

Файлы:

- `src/Experience/Renderer.ts`
- `src/types/renderer.ts`
- `src/core/Bootstrapper.ts`

Действия:

- определить поддержку `navigator.gpu`;
- добавить fallback/error screen;
- ввести DPR policy;
- логировать renderer mode один раз;
- изолировать WebGPU-specific post-processing.

Gate:

- WebGPU запускается;
- unsupported mode показывает понятное состояние;
- resize не ломает canvas;
- DPR capped на desktop/mobile.

## Phase 3: World Timeline

Цель: сделать Junni-style world orchestration.

### 3.1 Расширить `WorldConfig`

Новый shape:

```ts
interface SectionConfig {
  id: WorldSection
  range: [number, number]
  camera: CameraPreset
  baku: BakuPreset
  lighting: LightingPreset
  post: PostPreset
  ui: UiPreset
}
```

Файлы:

- `src/core/WorldConfig.ts`
- `src/core/types.ts`
- `src/core/CameraStateManager.ts`

Действия:

- заменить hardcoded section ranges;
- считать `sectionProgress` из config;
- интерполировать camera/baku/light/post presets;
- убрать лишнюю state-логику из `Experience.update()`.

Gate:

- каждая секция управляется config;
- новая секция добавляется без переписывания render loop.

### 3.2 Section Modules

Файлы:

- `src/Experience/World/Section.ts`
- `src/Experience/World/sections/HomeSection.ts`
- `src/Experience/World/sections/WorksSection.ts`
- `src/Experience/World/sections/AboutSection.ts`
- `src/Experience/World/sections/ContactSection.ts`

Действия:

- вернуть section abstraction;
- дать секциям `init/update/enter/leave/dispose`;
- перенести section-specific behavior из общего update.

Gate:

- `Experience` обновляет `WorldController`, а не знает детали секций.

## Phase 4: Camera Controller

Цель: довести камеру до Junni feel.

Файлы:

- `src/Experience/Camera.ts`
- `src/core/CameraStateManager.ts`
- `src/Utils/Easings.ts`

Действия:

- разделить base transform и final transform;
- cursor delay оставить только в final transform;
- FOV impulse привязать к transitions;
- shake запускать через state events;
- mobile получает reduced movement.

Gate:

- нет double smoothing;
- нет NaN velocity при low delta;
- camera motion отличается по секциям;
- `prefers-reduced-motion` снижает движение.

## Phase 5: Baku Role Object

Цель: центральный объект должен вести историю, как в Junni.

Файлы:

- `src/Experience/World/Baku.ts`
- `src/shaders/ProjectMaterial.ts`
- `src/shaders/env-effects.tsl.ts`
- `src/core/WorldConfig.ts`

States:

- `normal`;
- `glass`;
- `line`;
- `dark`;
- `project-focus`.

Действия:

- вынести material state в typed preset;
- добавить transition progress для material morph;
- связать Baku с project detail;
- сделать object readable на mobile.

Gate:

- по одному кадру можно понять активную секцию;
- материал не пересоздаётся каждый frame.

## Phase 6: Gallery / Detail

Цель: portfolio должен быть полноценным интерактивным продуктом.

Файлы:

- `src/core/GalleryManager.ts`
- `src/Experience/World/GalleryScene.ts`
- `src/UI/ProjectGallery.ts`
- `src/UI/ProjectDetail.ts`
- `src/UI/ProjectUISync.ts`

Действия:

- привести GalleryManager к явному FSM;
- states: `list`, `opening`, `detail`, `closing`;
- selected plane сохраняет start transform;
- detail UI синхронизируется с 3D progress;
- добавить back/Escape;
- убрать random purge.

Gate:

- gallery -> detail -> back без visual jump;
- keyboard работает;
- быстрые клики не ломают state.

## Phase 7: Asset Pipeline

Цель: staged loading как в Junni, но без global manager.

Файлы:

- `src/core/AssetManager.ts`
- `src/core/assetManifest.ts`
- `src/Data/Projects.ts`

Manifest:

```ts
interface AssetManifestItem {
  id: string
  url: string
  type: 'texture' | 'ktx2' | 'gltf' | 'env' | 'image'
  priority: 'pre' | 'must' | 'sub'
  context: string
  fallback?: string
}
```

Действия:

- собрать manifest;
- сделать `preload(priority)`;
- сделать `activateContext`;
- сделать `deactivateContext`;
- добавить reference counting;
- конвертировать GPU textures в KTX2.

Gate:

- no random disposal;
- no missing textures after 20 transitions;
- critical assets грузятся до первого кадра.

## Phase 8: Render Pipeline

Цель: перейти от single post node к production pipeline.

Файлы:

- `src/Experience/Renderer.ts`
- `src/Experience/PostProcessing.ts`
- `src/shaders/postprocessing.tsl.ts`
- `src/shaders/tsl-utils.ts`
- `references/geometry/MipMapGeometry.ts`

Pipeline:

```text
scene
-> anti-aliasing strategy
-> bloom bright
-> mip blur
-> composite
-> chromatic aberration
-> grain
-> vignette
-> output
```

Действия:

- сделать post adapter;
- добавить debug toggles;
- вынести параметры post в `WorldConfig`;
- bloom делать mip-based;
- сохранить low-tier без дорогих passes.

Gate:

- passes можно отключать независимо;
- no blank canvas;
- bloom не портит читабельность UI;
- mobile не перегревается.

## Phase 9: Studio UI

Цель: UI уровня топовой студии, без маркетингового hero.

Файлы:

- `src/assets/main.less`
- `src/UI/UIManager.ts`
- `src/UI/ProjectGallery.ts`
- `src/UI/ProjectDetail.ts`

Действия:

- первый экран сразу experience;
- typography grid desktop/mobile отдельно;
- text reveal без layout shift;
- visible focus states;
- reduced motion styles;
- loader со staged progress.

Gate:

- mobile не выглядит как уменьшенный desktop;
- нет hover-only сценариев;
- Lighthouse Accessibility >= 90.

## Phase 10: QA / Production Gate

Добавить:

- debug HUD;
- screenshot QA;
- performance profile checklist;
- memory leak checklist;
- release checklist.

Команды:

```bash
npm run build
npm run preview
```

Targets:

- desktop 60 FPS;
- mobile >= 45 FPS;
- Lighthouse Performance >= 85;
- Lighthouse Accessibility >= 90;
- no memory growth after 20 gallery/detail transitions;
- no visible DOM/WebGL desync.

## Итоговая Очередь Работ

1. Починить build.
2. Ввести renderer capabilities.
3. Нормализовать scroll/world timeline.
4. Вернуть section modules.
5. Довести camera controller.
6. Сделать Baku role object.
7. Починить gallery/detail FSM.
8. Ввести asset manifest/lifecycle.
9. Построить render pipeline.
10. Довести UI/mobile/accessibility.
11. Пройти QA/release gate.

## Не Начинать До Build Fix

- bloom pipeline;
- новые shader effects;
- дополнительные sections;
- аудио;
- сложные intro sequences.

Без зелёного build это создаст больше долга, чем качества.
