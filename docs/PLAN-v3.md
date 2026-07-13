# PLAN-v3 — Финальная доработка (8 пунктов)

> Создан 2026-07-13. Выполняется автономно.
> Пользователь: "ты не доделал..." — нужно довести до качества.

## Текущее состояние

| Область | Проблема | Решение |
|---|---|---|
| Header/navbar | Не по UIKit3, dropbar сырой | Переписать по UIKit3 navbar docs |
| Dropbar UI | Превьюшки есть, но UI не продуман | Редизайн: grid + covers + meta |
| Play button + modal | Есть, но UI недоделан | Доделать: custom controls, polished UI |
| Cursor wobble края | lineTo → острые углы | quadraticCurveTo → сглаженные |
| Works scale up | Есть, но слабо | Усилить: 3D rotateY + scale + blur |
| Shader transitions при клике | Только wobble pulse | Добавить: chromatic burst + scale |
| Navigation pattern | Dropbar navbar (не нравится) | Hamburger menu = правая секретная секция (joystick вправо) |
| Lab секция | Не lab на всех страницах | Левая секретная секция (joystick влево) = стилизованный список работ |

## Архитектурное решение (пункты 7+8)

### Новая навигационная модель
**Убрать dropbar navbar полностью.** Заменить на:
- **Header (всегда виден):** лого слева + hamburger button справа + lang/sound/theme
- **Joystick вправо (секция 5):** открывает NAVIGATION overlay (hamburger menu) — полноэкранное меню навигации по всем страницам
- **Joystick влево (секция 0):** LAB overlay — стилизованный список работ/experiments

### На всех страницах:
```
Секция 0 (joystick влево): LAB — experiments/works список (одинаковая на всех страницах)
Секция 1-4 (joystick вверх/вниз): контент страницы
Секция 5 (joystick вправо): NAVIGATION — hamburger menu (одинаковая на всех страницах)
```

### Home page:
```
Секция 0: LAB (тот же overlay)
Секция 1: Intro/Studio (cube)
Секция 2: About/Services
Секция 3: Works (carousel)
Секция 4: Manifesto
Секция 5: NAVIGATION (тот же overlay)
```

## План выполнения

### Фаза 1: Навигация как правая секретная секция (Пункт 7)
**Файлы:** новый `src/sections/nav/template.ts`, `src/sections/nav/scene.ts`, `src/pages/content/*`, `src/pages/home.ts`

- Создать `NavigationOverlay` — полноэкранное меню навигации
- Содержание: список всех страниц (Studio/Services/Works/Manifesto/Lab/Contact) + CTA
- Стиль: large typography, accent-lime hover, backdrop blur
- Заменить во ВСЕХ страницах секцию 5 (правая секретная) на navigation overlay
- Hamburger button в header открывает эту секцию (joystick вправо программно)

### Фаза 2: Lab как левая секретная секция (Пункт 8)
**Файлы:** новый `src/sections/lab-overlay/template.ts`, обновить `src/pages/content/*`

- Создать `LabOverlay` — стилизованный список работ/experiments
- Содержание: список проектов (из PROJECTS) + experiments
- Стиль: compact list с cover thumbnails, accent-lime hover
- Заменить во ВСЕХ страницах секцию 0 (левая секретная) на lab overlay

### Фаза 3: Header/navbar по UIKit3 (Пункт 1)
**Файлы:** `src/UI/UIMenu.ts`, `src/assets/main.less`

- Использовать UIKit3 `uk-navbar` с правильной структурой
- Header: лого + hamburger + lang/sound/theme (compact)
- Убрать dropbar (навигация теперь в overlay секции)
- Mobile: hamburger → joystick вправо (или прямой overlay)

### Фаза 4: Dropbar UI удалён (Пункт 2)
- Dropbar больше не нужен — навигация в overlay
- Убрать весь dropbar CSS + код из UIMenu

### Фаза 5: Play button + showreel modal — доделать (Пункт 3)
**Файлы:** `src/UI/ShowreelModal.ts`, `src/sections/intro/template.ts`, `main.less`

- Play button: улучшить UI (gradient ring, glow, better positioning)
- Modal: custom controls bar (play/pause, seek, time, mute, close)
- Video aspect ratio responsive
- Esc/Space/click-outside controls
- Custom cursor 'play' state на video

### Фаза 6: Cursor wobble сглаженные края (Пункт 4)
**Файлы:** `src/Experience/Cursor.ts`

- Заменить `lineTo` на `quadraticCurveTo` для noisy circle
- Сглаженные кривые вместо острых углов
- Больше сегментов (8 → 16) для плавности
- То же для drag arrows (rounded line caps)

### Фаза 7: Works scale up — усилить (Пункт 5)
**Файлы:** `src/assets/main.less`, `src/pages/content/works.ts`

- Scale 0.85 → 1.0 + rotateY(8deg) → 0deg (3D entry)
- Blur(8px) → 0 (focus effect)
- Stagger 0.15s → 0.2s (more dramatic)
- Cubic-bezier(0.16, 1, 0.3, 1) — organic ease

### Фаза 8: Shader transitions при клике — доделать (Пункт 6)
**Файлы:** `src/Experience/World/SplashCube.ts`, `src/UI/WorkCards.ts`

- triggerWobblePulse: boost uWobble 1.8 → 2.5 (dramatic)
- Добавить chromatic burst: временно boost dispersion 15 → 30
- Scale pulse: 1.0 → 1.2 → 1.0 (triggerOpener)
- Duration 0.8s → 1.2s (longer, more cinematic)

### Фаза 9: Финальная верификация
- type-check, lint, tests
- browser test
- commit + push

## Порядок
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
