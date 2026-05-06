# spec.md

## Technical Specification

Проект: `justlovejazz`
Тип: cinematic interactive studio portfolio
Референс уровня: `next.junni.co.jp`

## Stack

- TypeScript strict
- Vite
- Three.js
- Three.js TSL / Nodes
- WebGPU primary
- WebGL/fallback policy обязательна до production
- UIkit 3 + Less
- Lenis

## Runtime Architecture

### Entry

- `src/main.ts` создаёт `UIManager`.
- `Bootstrapper.init(ui)` собирает 3D experience.
- `Experience.update()` является единственным render loop.

### Core Contracts

#### `Bootstrapper`

Отвечает только за порядок инициализации:

1. создать `Experience`;
2. подключить event listeners;
3. создать managers;
4. загрузить world/gallery assets;
5. создать scene objects;
6. запустить render loop.

Не должен содержать animation logic.

#### `Renderer`

Обязательный contract:

```ts
type RendererMode = 'webgpu' | 'webgl' | 'unsupported'
type QualityTier = 'high' | 'medium' | 'low'
```

Требования:

- один canvas;
- контролируемый DPR;
- явная инициализация async renderer;
- post-processing подключается по capability;
- resize не создаёт новые renderer resources без disposal.

#### `CameraStateManager`

Отвечает за state, progress и target calculation.

Не должен напрямую менять `THREE.Camera`. Возвращает:

```ts
interface CameraTarget {
  position: THREE.Vector3
  lookAt: THREE.Vector3
  fov: number
}
```

#### `WorldConfig`

Единый источник section-поведения:

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

## Render Pipeline

Production target:

```text
scene
-> anti aliasing
-> bloom bright pass
-> mip blur passes
-> composite
-> chromatic aberration
-> grain
-> vignette
-> output
```

Текущий `postprocessing.tsl.ts` считать временной реализацией.

### Quality Tiers

`high`:

- WebGPU;
- full DPR policy;
- bloom mip pyramid;
- grain/vignette;
- project detail sampling.

`medium`:

- reduced bloom samples;
- capped DPR;
- simplified chromatic aberration.

`low`:

- no expensive bloom;
- no dynamic heavy distortions;
- stable readability first.

## Motion

Все движения обязаны быть:

- state-driven;
- delta-time aware;
- без linear interpolation в финальном визуальном слое;
- отключаемыми/упрощаемыми при `prefers-reduced-motion`.

Camera:

- base target smoothing;
- delayed cursor response;
- FOV impulse;
- optional organic shake;
- mobile reduced movement.

Gallery:

- infinite/looping logic без скачков;
- selected project сохраняет start transform;
- detail transition синхронизирован с UI.

## Assets

Asset manifest обязателен:

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

Правила:

- UI/content images: AVIF/WebP;
- GPU textures: KTX2/Basis;
- HDR/env assets lazy where possible;
- dispose только по inactive context;
- cache не удаляет ресурс, если его использует active material.

## UI / UX

Требования:

- canvas и DOM имеют один общий state;
- нет hover-only управления;
- project detail доступен с клавиатуры;
- loader показывает реальный progress или честный staged state;
- text reveal не вызывает layout shift;
- mobile layout проектируется отдельно.

## Accessibility

Минимум:

- `prefers-reduced-motion`;
- keyboard focus;
- Escape из detail state;
- semantic links/buttons;
- contrast AA;
- Lighthouse Accessibility >= 90.

## Performance Budget

Targets:

- desktop: stable 60 FPS;
- mobile: >= 45 FPS на средних устройствах;
- critical textures <= 2 MB после оптимизации;
- no steady-state long tasks > 100 ms;
- no memory growth after repeated transitions.

## Definition Of Done

- `npm run build` проходит.
- `noUnusedLocals` не маскируется через отключение строгих проверок.
- Renderer mode и quality tier логируются.
- Все секции достижимы scroll/touch/keyboard.
- Gallery -> detail -> back работает без visual jumps.
- WebGPU path стабилен.
- Fallback поведение определено и протестировано.
- Нет активных TODO, которые маскируют production blocker.
