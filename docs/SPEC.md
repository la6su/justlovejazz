# SPEC.md

## Technical Specification

Проект: `justlovejazz`

     1|# spec.md
     2|
     3|## Technical Specification
     4|
     5|Проект: `justlovejazz`
     6|Тип: cinematic interactive studio portfolio
     7|Референс уровня: `next.junni.co.jp`
     8|
     9|## Stack
    10|
    11|- TypeScript strict
    12|- Vite
    13|- Three.js
    14|- Three.js TSL / Nodes
    15|- WebGPU primary
    16|- WebGL/fallback policy обязательна до production
    17|- UIkit 3 + Less
    18|- Lenis
    19|
    20|## Runtime Architecture
    21|
    22|### Entry
    23|
    24|- `src/main.ts` создаёт `UIManager`.
    25|- `Bootstrapper.init(ui)` собирает 3D experience.
    26|- `Experience.update()` является единственным render loop.
    27|
    28|### Core Contracts
    29|
    30|#### `Bootstrapper`
    31|
    32|Отвечает только за порядок инициализации:
    33|
    34|1. создать `Experience`;
    35|2. подключить event listeners;
    36|3. создать managers;
    37|4. загрузить world/gallery assets;
    38|5. создать scene objects;
    39|6. запустить render loop.
    40|
    41|Не должен содержать animation logic.
    42|
    43|#### `Renderer`
    44|
    45|Обязательный contract:
    46|
    47|```ts
    48|type RendererMode = 'webgpu' | 'webgl' | 'unsupported'
    49|type QualityTier = 'high' | 'medium' | 'low'
    50|```
    51|
    52|Требования:
    53|
    54|- один canvas;
    55|- контролируемый DPR;
    56|- явная инициализация async renderer;
    57|- post-processing подключается по capability;
    58|- resize не создаёт новые renderer resources без disposal.
    59|
    60|#### `CameraStateManager`
    61|
    62|Отвечает за state, progress и target calculation.
    63|
    64|Не должен напрямую менять `THREE.Camera`. Возвращает:
    65|
    66|```ts
    67|interface CameraTarget {
    68|  position: THREE.Vector3
    69|  lookAt: THREE.Vector3
    70|  fov: number
    71|}
    72|```
    73|
    74|#### `WorldConfig`
    75|
    76|Единый источник section-поведения:
    77|
    78|```ts
    79|interface SectionConfig {
    80|  id: WorldSection
    81|  range: [number, number]
    82|  camera: CameraPreset
    83|  baku: BakuPreset
    84|  lighting: LightingPreset
    85|  post: PostPreset
    86|  ui: UiPreset
    87|}
    88|```
    89|
    90|## Render Pipeline
    91|
    92|Production target:
    93|
    94|```text
    95|scene
    96|-> anti aliasing
    97|-> bloom bright pass
    98|-> mip blur passes
    99|-> composite
   100|-> chromatic aberration
   101|-> grain
   102|-> vignette
   103|-> output
   104|```
   105|
   106|Текущий `postprocessing.tsl.ts` считать временной реализацией.
   107|
   108|### Quality Tiers
   109|
   110|`high`:
   111|
   112|- WebGPU;
   113|- full DPR policy;
   114|- bloom mip pyramid;
   115|- grain/vignette;
   116|- project detail sampling.
   117|
   118|`medium`:
   119|
   120|- reduced bloom samples;
   121|- capped DPR;
   122|- simplified chromatic aberration.
   123|
   124|`low`:
   125|
   126|- no expensive bloom;
   127|- no dynamic heavy distortions;
   128|- stable readability first.
   129|
   130|### Motion
   131|
   132|Все движения обязаны быть:
   133|
   134|- state-driven;
   135|- delta-time aware;
   136|- без linear interpolation в финальном визуальном слое;
   137|- отключаемыми/упрощаемыми при `prefers-reduced-motion`.
   138|
   139|Camera:
   140|
   141|- base target smoothing [x];
   142|- delayed cursor response [x];
   143|- FOV impulse (Arrival Pulse) [x];
   144|- organic shake (combined-sine) [x];
   145|- mobile reduced movement.
   146|
   147|Gallery:
   148|
   149|- infinite/looping logic без скачков;
   150|- selected project сохраняет start transform;
   151|- detail transition синхронизирован с UI.
   152|
   153|## Assets
   154|
   155|Asset manifest обязателен:
   156|
   157|```ts
   158|interface AssetManifestItem {
   159|  id: string
   160|  url: string
   161|  type: 'texture' | 'ktx2' | 'gltf' | 'env' | 'image'
   162|  priority: 'pre' | 'must' | 'sub'
   163|  context: string
   164|  fallback?: string
   165|}
   166|```
   167|
   168|Правила:
   169|
   170|- UI/content images: AVIF/WebP;
   171|- GPU textures: KTX2/Basis (with Bicubic filtering where supported) [x];
   172|- HDR/env assets lazy where possible;
   173|- dispose только по inactive context [x];
   174|- cache не удаляет ресурс, если его использует active material.
   175|
   176|## UI / UX
   177|
   178|Требования:
   179|
   180|- canvas и DOM имеют один общий state;
   181|- нет hover-only управления;
   182|- project detail доступен с клавиатуры;
   183|- loader показывает реальный progress или честный staged state;
   184|- text reveal не вызывает layout shift;
   185|- mobile layout проектируется отдельно.
   186|
   187|## Accessibility
   188|
   189|Минимум:
   190|
   191|- `prefers-reduced-motion`;
   192|- keyboard focus;
   193|- Escape из detail state;
   194|- semantic links/buttons;
   195|- contrast AA;
   196|- Lighthouse Accessibility >= 90.
   197|
   198|## Performance Budget
   199|
   200|Targets:
   201|
   202|- desktop: stable 60 FPS;
   203|- mobile: >= 45 FPS на средних устройствах;
   204|- critical textures <= 2 MB после оптимизации;
   205|- no steady-state long tasks > 100 ms;
   206|- no memory growth after repeated transitions.
   207|
   208|## Definition Of Done
   209|
   210|- `npm run build` проходит.
   211|- `noUnusedLocals` не маскируется через отключение строгих проверок.
   212|- Renderer mode и quality tier логируются.
   213|- Все секции достижимы scroll/touch/keyboard.
   214|- Gallery -> detail -> back работает без visual jumps.
   215|- WebGPU path стабилен.
   216|- Fallback поведение определено и протестировано.
   217|- Нет активных TODO, которые маскируют production blocker.
   218|

---

## Three.js / TSL Production Spec

     1|# threejs_tsl_full_spec.md
     2|
     3|## Three.js / TSL Production Spec
     4|
     5|Цель: использовать Three.js TSL как production-инструмент, а не как экспериментальный слой без контрактов.
     6|
     7|## Renderer Contract
     8|
     9|```ts
    10|export type RendererMode = 'webgpu' | 'webgl' | 'unsupported'
    11|export type QualityTier = 'high' | 'medium' | 'low'
    12|
    13|export interface RendererCapabilities {
    14|  mode: RendererMode
    15|  tier: QualityTier
    16|  maxDpr: number
    17|  postProcessing: boolean
    18|  floatRenderTargets: boolean
    19|}
    20|```
    21|
    22|Правила:
    23|
    24|- WebGPU path основной.
    25|- WebGL path должен быть либо реализован, либо явно заменён unsupported screen.
    26|- Никаких `any` вокруг post-processing без локального adapter.
    27|- Renderer не знает о конкретных секциях.
    28|
    29|## TSL Rules
    30|
    31|- Использовать method chaining: `.add()`, `.mul()`, `.sub()`.
    32|- Утилиты держать в `src/shaders/tsl-utils.ts`.
    33|- Не смешивать GLSL strings и TSL в одном material без adapter.
    34|- Любой expensive node должен иметь quality tier switch.
    35|- `time`, `uv`, `uniform` используются через тонкие helpers, если они повторяются.
    36|
    37|## Shader Modules
    38|
    39|```text
    40|src/shaders/
    41|├── background.tsl.ts
    42|├── env-effects.tsl.ts
    43|├── noise.tsl.ts
    44|├── postprocessing.tsl.ts
    45|├── project-dive.tsl.ts
    46|├── ProjectMaterial.ts
    47|└── tsl-utils.ts
    48|```
    49|
    50|## Post-Processing Target
    51|
    52|Минимальный production pipeline:
    53|
    54|1. scene color;
    55|2. anti-aliasing strategy;
    56|3. bright extraction;
    57|4. mip bloom blur;
    58|5. composite;
    59|6. chromatic aberration;
    60|7. grain;
    61|8. vignette;
    62|9. output color management.
    63|
    64|Текущий single-node soft glow допустим только как temporary fallback.
    65|
    66|## Materials
    67|
    68|### Project Material
    69|
    70|Обязан поддерживать:
    71|
    72|- base texture;
    73|- detail texture;
    74|- transition progress;
    75|- hover/active state;
    76|- fullscreen sampling mode;
    77|- reduced quality path.
    78|
    79|### Baku Material
    80|
    81|Обязан поддерживать states:
    82|
    83|- `normal`;
    84|- `glass`;
    85|- `line`;
    86|- `dark`;
    87|- `project-focus`.
    88|
    89|Material state приходит из `WorldConfig`, не из случайной логики внутри mesh.
    90|
    91|## Noise
    92|
    93|Использовать:
    94|
    95|- low-frequency noise для органики;
    96|- high-frequency grain только в final composite;
    97|- 4D noise для looping/time-based motion, если он реально нужен.
    98|
    99|Не использовать noise как замену композиции.
   100|
   101|## Performance Rules
   102|
   103|- DPR capped.
   104|- Mobile получает reduced movement и reduced shader tier.
   105|- Не создавать vectors/materials/geometries внутри hot loop без причины.
   106|- Не вызывать texture disposal из random/runtime эвристик.
   107|- Debug toggles обязательны для дорогих passes.
   108|
   109|## Testing
   110|
   111|Минимальные проверки:
   112|
   113|- build;
   114|- renderer mode detection;
   115|- canvas не blank после init;
   116|- resize не ломает aspect/post targets;
   117|- project detail transition не создаёт NaN transform;
   118|- memory не растёт после повторных transitions.
   119|
   120|## Implementation Order
   121|
   122|1. Renderer adapter.
   123|2. Capability detection.
   124|3. Quality tier config.
   125|4. Stable post-processing adapter.
   126|5. Project material sampling.
   127|6. Bloom pipeline.
   128|7. Visual QA.
   129|