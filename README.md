# justlovejazz

Интерактивный portfolio/showcase на **Three.js**, **TSL** и **WebGPU**. Референс по уровню движения, сценической логике и polish: [junni-inc/next.junni.co.jp](https://github.com/junni-inc/next.junni.co.jp).

## Цель

Довести проект до уровня production-сайта топовой web-дизайн студии:

- точная арт-дирекция, без случайных эффектов;
- cinematic camera, scroll-bound world и state-driven 3D;
- стабильный рендер без рывков, утечек памяти и layout shifts;
- измеримые performance, accessibility и QA-гейты.

## Текущий статус

Реализовано:

- `Bootstrapper` для асинхронного запуска;
- `Experience`, `Renderer`, `Camera`, `WorldConfig`;
- `CameraStateManager` с состояниями `INTRO`, `EXPLORE`, `DETAIL`, `TRANSITION`;
- `GalleryManager` и `GalleryScene`;
- TSL-материалы и production-ready post-processing chain (Chromatic Aberration, Bloom, Grain, Vignette);
- `AssetManager` с контекстным dispose и Bicubic-фильтрацией;
- Кинематографическая камера: Organic Handheld Shake, Dynamic FOV Transitions, Arrival Pulse;
- Атмосферный слой: `FogExp2` и система частиц глубины.

Не считать готовым:

- WebGL2 fallback пока не реализован как отдельный runtime path;
- SMAA и bloom mip-pyramid bloom пока не являются production pipeline;
- asset pipeline не завершён: JPEG/PNG должны пройти AVIF/WebP/KTX2;
- нет автоматического performance budget, визуальных регрессий и accessibility-аудита.

## Stack

- TypeScript strict
- Vite
- Three.js `0.184+`
- Three.js TSL / Nodes
- WebGPU primary
- UIkit 3 + Less
- Lenis

## Архитектура

```text
src/
├── core/
│   ├── AssetManager.ts
│   ├── Bootstrapper.ts
│   ├── CameraStateManager.ts
│   ├── GalleryManager.ts
│   ├── WorldConfig.ts
│   └── types.ts
├── Experience/
│   ├── Camera.ts
│   ├── Renderer.ts
│   ├── Input.ts
│   ├── SmoothScroll.ts
│   └── World/
│       ├── Baku.ts
│       ├── Environment.ts
│       └── GalleryScene.ts
├── shaders/
│   ├── ProjectMaterial.ts
│   ├── postprocessing.tsl.ts
│   └── tsl-utils.ts
└── UI/
```

## Команды

```bash
npm run dev
npm run build
```

## Production Gate

Перед релизом обязательны:

- `npm run build` без ошибок;
- desktop: stable 60 FPS на целевом устройстве;
- mobile: стабильная интеракция без перегрева и layout shifts;
- WebGPU path + fallback policy;
- Lighthouse: Performance >= 85, Accessibility >= 90;
- ручной motion review: нет linear/floaty-переходов;
- проверка disposal для textures/materials/geometries.

## LLM Agents

Общие инструкции для Codex, Hermes/llama.cpp и других локальных агентов: `AGENTS.md`.

Автономный протокол для Hermes Agent: `HERMES_AUTONOMY.md`.
