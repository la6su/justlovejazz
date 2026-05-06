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
- TSL-материалы и базовый post-processing node;
- `AssetManager` с KTX2/Basis-загрузчиком и ручным purge.

Не считать готовым:

- `npm run build` сейчас падает на TypeScript errors;
- WebGL2 fallback пока не реализован как отдельный runtime path;
- SMAA, mip-pyramid bloom и bicubic upsampling пока не являются production pipeline;
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
