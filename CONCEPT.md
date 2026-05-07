# CONCEPT.md

## JustLoveJazz: Cinematic Studio System

Проект не должен выглядеть как набор WebGL-эффектов. Он должен ощущаться как цельная студийная система: строгая типографика, управляемая сцена, точное движение, высокая плотность деталей.

Референс: `next.junni.co.jp`. Берём не визуальное копирование, а принципы:

- world-driven storytelling;
- scroll как режиссёрская временная шкала;
- центральный 3D-объект, меняющий поведение по секциям;
- камера с инерцией, FOV-акцентами и микродвижением;
- staged loading: `pre`, `must`, `sub`;
- post-processing как часть арт-дирекции, а не фильтр поверх картинки.

## Дизайн-принципы

### 1. Система важнее эффекта

Любой визуальный приём должен отвечать на вопрос: что он делает для восприятия проекта? Если ответ только “красиво”, приём удаляется или упрощается.

### 2. Ритм важнее плавности

Движение должно быть точным:

- no linear motion;
- easing и inertia по умолчанию;
- stagger только там, где он помогает считывать иерархию;
- быстрый старт, контролируемый акцент, короткое затухание.

### 3. Контраст важнее декора

Базовый язык:

- глубокий чёрный;
- технический серый;
- один сильный акцент;
- крупная, но не маркетинговая типографика;
- асимметрия с оптическим балансом.

### 4. Render-driven UX

DOM и WebGL не должны спорить. UI объясняет состояние, сцена создаёт ощущение.

Обязательные связи:

- scroll progress -> world state;
- pointer velocity -> camera/environment response;
- active project -> camera/detail material transition;
- section -> lighting/material/post-processing preset.

## Junni Patterns Для Адаптации [Current Status]

1. `CameraController`: base camera + delayed cursor + FOV offset + organic shake [Implemented: FOV Transitions, Arrival Pulse, Handheld Shake].
2. `World`: секции с собственными camera/baku/post presets [Implemented: Section-driven State Machine].
3. `Baku`: один центральный объект, который меняет материал, позу и роль [Implemented: Section-based Material Sync].
4. `AssetManager`: загрузка по приоритетам `pre`, `must`, `sub` [Implemented: Contextual Disposal].
5. `RenderPipeline`: отдельные проходы SMAA, bloom, composite, grain/vignette [Implemented: TSL Chain + Bicubic Filtering].
6. `NoiseText`: текстовая микроанимация как акцент, не как постоянный шум.

## Не Делать

- Не копировать Junni assets, тексты, модели и графику.
- Не добавлять эффекты без состояния и причины.
- Не маскировать плохую композицию bloom/grain.
- Не объявлять production-ready без измерений.
- Не держать одинаковый layout на desktop и mobile, если поведение отличается.

## Definition Of Done Для Концепта

- Пользователь понимает структуру сайта за 5 секунд.
- Переходы ощущаются намеренными, а не случайными.
- 3D-сцена помогает читать portfolio, а не мешает.
- Страница выдерживает паузу: кадр выглядит как законченный постер.
- Mobile-версия спроектирована отдельно, а не просто уменьшена.
