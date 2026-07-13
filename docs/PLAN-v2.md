# PLAN-v2 — Глубокая доработка (7 пунктов брифа)

> Создан 2026-07-13. Выполняется автономно без остановок.
> Все 7 пунктов брифа закрываются последовательно с верификацией.

## Текущее состояние (исследование)

| Область | Файл | Состояние | Проблема |
|---|---|---|---|
| Wobble cube | `SplashCube.ts` | uWobble=0.70, SIZE_SCALE=0.07 | Слишком медленно/незаметно |
| Cursor | `Cursor.ts` | spring physics (stiffness 0.25) | Мелкий, нет кастомных состояний |
| Intro play button | `intro/template.ts` | нет | Нет showreel modal |
| Works cards | `WorkCards.ts` + `works.ts` | `uk-animation-fade` (opacity only) | Не scale up при появлении |
| Carousel click | `BakuCarousel.ts` | нет scale effect | Нет wobble shader при клике |
| Header/navbar | `UIMenu.ts` | theme toggle center, no logo | Нет лого, language switch, sound toggle, dropbar previews |
| Brand identity | разрозненно | Inter font, accent blue-grey | Нет единого визуального языка |
| RU services titles | `i18n.ts` | "Креативное направление", "Интерактивная разработка" | Длинные |
| Content pages | `manifesto/lab/contact/works.ts` | 4 секции каждая | Проверить осмысленность |

## План выполнения

### Фаза 1: Wobble cube — увеличить амплитуду (Пункт 3)
**Файлы:** `SplashCube.ts`, `MeshTransmissionMaterial.ts`

- uWobble: 0.70 → **0.95** (заметнее, но не рвёт форму)
- SIZE_SCALE: 0.07 → **0.09** (чуть больше displacement)
- Время: оставить замедленным (0.2/0.3) — элегантность
- mat.wobble (WebGL2): 0.70 → 0.95 (синхрон)

**Критерий:** wobble виден при просмотре, куб сохраняет форму, плавно.

---

### Фаза 2: Cursor — больше + сглаженный wobble + кастомные состояния (Пункт 1a)
**Файлы:** `Cursor.ts`, `main.less`

- **Размер:** baseRadius 20 → **28**, targetRadius 36 → **44** (крупнее)
- **Сглаживание:** spring stiffness 0.25 → **0.18**, damping 0.55 → **0.7** (плавнее wobble)
- **Кастомные состояния (data-cursor attribute):**
  - `data-cursor="play"` — треугольник play (для showreel)
  - `data-cursor="drag"` — рука/стрелки (для carousel)
  - `data-cursor="view"` — глаз/лупа (для project cards)
  - `data-cursor="muted"` / `data-cursor="unmuted"` — для sound panel
- **Реализация:** mouseover проверяет `[data-cursor]` → ставит `cursor-state` class → drawCircle рисует разную форму
- **Mobile:** отключить (уже есть @media max-width:500px)

**Критерий:** курсор крупнее, плавно wobble'ится, меняет форму на play/drag/view.

---

### Фаза 3: Play button на intro + showreel modal (Пункт 1b)
**Файлы:** `intro/template.ts`, новый `src/UI/ShowreelModal.ts`, `main.less`

- **Play button:** круглый, по центру куба (position absolute, center), 80px
- **Иконка:** SVG треугольник play
- **Custom cursor:** `data-cursor="play"` → курсор становится треугольником
- **Showreel modal:**
  - Fullscreen overlay (как ProjectOverlay)
  - HTML5 `<video>` элемент (src: `/assets/video/coming-soon.mp4` — есть в public)
  - Custom controls: play/pause, mute, close
  - Esc закрывает, click outside закрывает
  - Auto-play на open (muted, user click unmute)
- **Кастомный курсор в modal:** `data-cursor="play"` на video

**Критерий:** на intro видна кнопка play по центру, клик открывает modal с видео.

---

### Фаза 4: Works cards scale up при появлении (Пункт 2a)
**Файлы:** `works.ts`, `constants.ts` (PAGE_REVEAL), `main.less`

- **Проблема:** `PAGE_REVEAL` = `uk-animation-fade` (только opacity)
- **Решение:** добавить `uk-animation-scale-up` для work cards grid
- **Анимация:** scale(0.85) + opacity(0) → scale(1) + opacity(1) за 0.6s ease-out
- **Триггер:** `.section-active .jlz-works-grid` → CSS transition
- **Stagger:** каждая карточка с delay `index * 100ms`
- **При смене секции:** старая уходит, новая приходит с scale up

**Реализация CSS:**
```less
.jlz-works-grid .jlz-work-card {
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.section-active .jlz-works-grid .jlz-work-card {
  opacity: 1;
  transform: scale(1);
}
.section-active .jlz-works-grid .jlz-work-card:nth-child(1) { transition-delay: 0.1s; }
.section-active .jlz-works-grid .jlz-work-card:nth-child(2) { transition-delay: 0.2s; }
```

**Критерий:** при появлении секции карточки плавно scale up с stagger.

---

### Фаза 5: Wobble shader scale при клике (Пункт 2b)
**Файлы:** `WorkCards.ts`, `BakuCarousel.ts`, `SplashCube.ts`

- **Wobble scale effect:** при клике на карточку/карусель → куб делает scale pulse с wobble усилением
- **Реализация:**
  - `SplashCube.triggerWobblePulse()` — временно увеличивает uWobble до 1.5 на 0.8s
  - `WorkCards.ts` click handler → `window.dispatchEvent(new CustomEvent('jlz:wobble-pulse'))`
  - `Experience.ts` слушает → `baku.triggerWobblePulse()`
  - `BakuCarousel.ts` onCardClick → тот же event
- **Эффект:** куб драматично пульсирует при открытии проекта

**Критерий:** клик на карточку/карусель → куб делает wobble pulse.

---

### Фаза 6: Header/navbar — лого, language, sound, dropbar previews (Пункт 4)
**Файлы:** `UIMenu.ts`, `main.less`, `i18n.ts`

- **Лого:** `l@6` слева (вместо center) — monogram текст
- **Layout:**
  ```
  [l@6]  Studio  Services  Works  Manifesto        [lang] [sound] [theme]
  ```
- **Language switch:** кнопка `EN | RU` — toggle, dispatches `jlz:lang-change`
- **Sound toggle:** иконка speaker (в navbar, не только SoundPanel)
- **Dropbar previews:** для works — миниатюры проектов (cover images), для других — иконки/числа
- **Responsive mobile:**
  - Desktop: full navbar
  - Mobile (<768px): hamburger menu → offcanvas с теми же пунктами
  - Language + sound всегда видны (compact icons)
- **Стиль:** modern, minimal, accent-border на hover, backdrop-filter blur

**Критерий:** лого слева, nav по центру, controls справа, dropbar с превью, mobile hamburger.

---

### Фаза 7: Айдентика и визуальный язык (Пункт 5)
**Файлы:** `main.less`, `_theme-fixes.less`, новый `docs/BRAND.md`

- **Цветовая система:**
  - Background: deep black `#0a0a0f`
  - Foreground: near-white `#f5f5f7`
  - Accent: neon-lime `#c4ff00` (из брифа)
  - Accent-hover: `#d4ff4d`
  - Muted: `rgba(245,245,247,0.5)`
- **Типографика:** остаётся Inter (нет времени менять шрифты), но добавить:
  - Display weight 900 для hero
  - Letter-spacing tighter для заголовков
  - Monospace для технических лейблов (JetBrains Mono fallback)
- **Голос бренда:** "Тихая уверенность. Технология как искусство."
  - Короткие предложения
  - Технические термины без объяснений
  - CTA: "Explore", "Start", "Open" — глаголы действия
- **Манифест через стиль:**
  - Минимум слов, максимум смысла
  - Тёмная тема как default (inverse = light)
  - Accent-lime только для CTA и активных состояний
- **Документ:** `docs/BRAND.md` — brand guidelines

**Критерий:** единый визуальный язык, accent-lime для CTA, BRAND.md документ.

---

### Фаза 8: RU services titles — упростить (Пункт 6)
**Файлы:** `i18n.ts`

| Было (RU) | Стало (RU) | Почему |
|---|---|---|
| Креативное направление | **Креатив** | Короче |
| Интерактивная разработка | **Разработка** | Короче |
| Движение и реальное время | **Моушн** | Одно слово |
| ИИ-системы | **AI-системы** | Современнее |
| ЛАБОРАТОРИЯ | **Лаб** | Короче |
| ПЛОЩАДКА | **Плейграунд** | Понятнее |

Также обновить leads (подзаголовки) — сделать короче.

**Критерий:** RU заголовки короткие, помещаются в одну строку на mobile.

---

### Фаза 9: Контент страниц — осмысленность (Пункт 7)
**Файлы:** `manifesto.ts`, `lab.ts`, `contact.ts`, `works.ts`

Проверить каждую страницу:
- **Manifesto:** 4 принципа (Purpose, Clarity, Emotion, Simplicity) — оставить, но убрать лишние слова
- **Lab:** 4 эксперимента — оставить, но упростить desc
- **Contact:** 4 секции — оставить, но проверить CTA
- **Works:** 4 секции — проверить заголовки секций (не дублируют ли)

**Принцип:** "не контент ради контента" — каждое слово несёт смысл, каждый CTA ведёт к действию.

**Критерий:** все страницы имеют чёткие посылы и CTA, нет воды.

---

### Фаза 10: Финальная верификация
- `bun run type-check` — 0 errors
- `bun run lint` — 0 errors
- Browser test: wobble visible, cursor states, play button, card scale, dropbar
- Commit + push каждой фазы
- Обновить WORKLOG.md, STATUS.md

## Порядок выполнения
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

Каждая фаза: реализация → type-check → commit → следующая.
Без остановок, без вопросов.
