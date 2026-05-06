# threejs_tsl_full_spec.md

## Three.js / TSL Production Spec

Цель: использовать Three.js TSL как production-инструмент, а не как экспериментальный слой без контрактов.

## Renderer Contract

```ts
export type RendererMode = 'webgpu' | 'webgl' | 'unsupported'
export type QualityTier = 'high' | 'medium' | 'low'

export interface RendererCapabilities {
  mode: RendererMode
  tier: QualityTier
  maxDpr: number
  postProcessing: boolean
  floatRenderTargets: boolean
}
```

Правила:

- WebGPU path основной.
- WebGL path должен быть либо реализован, либо явно заменён unsupported screen.
- Никаких `any` вокруг post-processing без локального adapter.
- Renderer не знает о конкретных секциях.

## TSL Rules

- Использовать method chaining: `.add()`, `.mul()`, `.sub()`.
- Утилиты держать в `src/shaders/tsl-utils.ts`.
- Не смешивать GLSL strings и TSL в одном material без adapter.
- Любой expensive node должен иметь quality tier switch.
- `time`, `uv`, `uniform` используются через тонкие helpers, если они повторяются.

## Shader Modules

```text
src/shaders/
├── background.tsl.ts
├── env-effects.tsl.ts
├── noise.tsl.ts
├── postprocessing.tsl.ts
├── project-dive.tsl.ts
├── ProjectMaterial.ts
└── tsl-utils.ts
```

## Post-Processing Target

Минимальный production pipeline:

1. scene color;
2. anti-aliasing strategy;
3. bright extraction;
4. mip bloom blur;
5. composite;
6. chromatic aberration;
7. grain;
8. vignette;
9. output color management.

Текущий single-node soft glow допустим только как temporary fallback.

## Materials

### Project Material

Обязан поддерживать:

- base texture;
- detail texture;
- transition progress;
- hover/active state;
- fullscreen sampling mode;
- reduced quality path.

### Baku Material

Обязан поддерживать states:

- `normal`;
- `glass`;
- `line`;
- `dark`;
- `project-focus`.

Material state приходит из `WorldConfig`, не из случайной логики внутри mesh.

## Noise

Использовать:

- low-frequency noise для органики;
- high-frequency grain только в final composite;
- 4D noise для looping/time-based motion, если он реально нужен.

Не использовать noise как замену композиции.

## Performance Rules

- DPR capped.
- Mobile получает reduced movement и reduced shader tier.
- Не создавать vectors/materials/geometries внутри hot loop без причины.
- Не вызывать texture disposal из random/runtime эвристик.
- Debug toggles обязательны для дорогих passes.

## Testing

Минимальные проверки:

- build;
- renderer mode detection;
- canvas не blank после init;
- resize не ломает aspect/post targets;
- project detail transition не создаёт NaN transform;
- memory не растёт после повторных transitions.

## Implementation Order

1. Renderer adapter.
2. Capability detection.
3. Quality tier config.
4. Stable post-processing adapter.
5. Project material sampling.
6. Bloom pipeline.
7. Visual QA.
