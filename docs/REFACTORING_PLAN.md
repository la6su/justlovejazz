# REFACTORING_PLAN

> Last updated: 2026-06-17. See `docs/STATUS.md` for canonical state.
> Практичный план рефакторинга без усложнений.

## 0) Актуальный baseline (2026-06-17)

- `npm run type-check` — ✅ проходит.
- `npm run build` — ✅ проходит.
- Bundle: `chunk-core` 644 KB minified (gzip 184 KB) — без oversized-warning
  (исторически было ~1.6 MB, сейчас значительно лучше).
- Контракт capabilities: `webgpu | webgl | unsupported` — единый source of truth.
- WebGPU TSL pipeline: production-grade (BloomNode mip-chain + chromatic +
  grain + vignette + ACES tonemap).
- Все window listeners чистятся на destroy (no HMR leaks).

## 1) Принципы рефакторинга

1. Сначала стабильность и контракты, потом визуальная полировка.
2. Небольшие изменения с проверкой после каждого шага.
3. Никаких новых зависимостей без явной необходимости.
4. Явная стратегия fallback: WebGPU primary, WebGL safe fallback, unsupported
   с понятным UX.

## 2) Фазы работ (status)

### Фаза A — Stabilize Contracts ✅ DONE

- ✅ Единый runtime-контракт `RendererCapabilities` — single source of truth.
- ✅ Все ветки `webgpu`, `webgl`, `unsupported` исполняемы + корректный UX.
- ✅ Motion policy в одном пути (`prefers-reduced-motion` + quality tier).

### Фаза B — Timeline and Scene State ✅ DONE

- ✅ `scroll → worldState → camera/post` нормализован к 0..1.
- ✅ Магические коэффициенты убраны — per-section `camFovOffset`/`camFovDuration`/
  `camSmoothing` в WorldConfig.
- ✅ Синхронизация DOM/3D на works (data-page gate + ProjectOverlay event-driven).

### Фаза C — Asset and GPU Lifecycle ✅ DONE

- ✅ Ownership для текстур/материалов/геометрий/таргетов документирован.
- ✅ Случайный disposal убран — только lifecycle-driven (AssetManager.disposeContext).
- ✅ Deactivation/disposal контекстов к единым правилам.
- ✅ Все window listeners (Sizes/Renderer/Camera/Input) чистятся на destroy.

### Фаза D — Bundle and Loading ✅ DONE (partial)

- ✅ `chunk-core` 644 KB (был ~1.6 MB) — практичным split-by-feature в vite.config.ts.
- ✅ Lazy-loading в `main-app.ts` (ErrorTracker, UIManager, Bootstrapper,
  DissolveOverlay — dynamic imports).
- ✅ Критичный путь не блокируется тяжёлыми non-critical модулями.
- ⏳ Дальнейший split отложен до real-perf data (Lighthouse).

### Фаза E — Production QA Gate 🔄 PARTIAL

- 🔄 Desktop + mobile smoke — нужен real-device тестинг.
- ✅ Accessibility-минимум: reduced motion, keyboard escape/back, non-hover
  critical flow, ARIA roles on splash/progress, focus-visible on interactive.
- ✅ Финальная сверка docs с реализацией (этот pass).

## 3) Definition of Production-Ready

Функция считается production-ready только если одновременно:

1. ✅ Контракты типов и runtime совпадают.
2. ✅ Явное поведение для `webgpu`, `webgl`, `unsupported`.
3. ✅ Lifecycle ресурсов прозрачен и воспроизводим.
4. 🔄 Нет критичных перф-регрессий на mobile (pending Lighthouse).
5. ✅ Документация описывает фактическое поведение.

## 4) Минимальный цикл в каждой задаче

1. Локальная правка ограниченного объёма.
2. `npm run type-check`
3. `npm run build`
4. Короткая запись в `docs/CHANGELOG.md` (что изменили и зачем).
