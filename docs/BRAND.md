# BRAND — Visual Identity & Voice Guidelines

> JUSTLOVEJAZZ — hardcore cinematic webdesign-3d-studio.
> Тихая уверенность. Технология как искусство.

## Цветовая система

### Dark theme (default)
| Token | Value | Usage |
|---|---|---|
| `--jlz-bg` | `#0a0a0f` | Background (deep black) |
| `--jlz-fg` | `#f5f5f7` | Foreground (near-white) |
| `--jlz-accent` | `#c4ff00` | CTA, active states, hover (neon-lime) |
| `--jlz-accent-hover` | `#d4ff4d` | Accent hover state |
| `--jlz-muted` | `rgba(245,245,247,0.5)` | Secondary text |
| `--jlz-border` | `rgba(245,245,247,0.06)` | Borders, dividers |

### Light theme (inverse)
| Token | Value | Usage |
|---|---|---|
| `--jlz-bg` | `#f5f5f7` | Background |
| `--jlz-fg` | `#0a0a0f` | Foreground |
| `--jlz-accent` | `#c4ff00` | Same accent (neon-lime works on both) |
| `--jlz-muted` | `rgba(10,10,15,0.5)` | Secondary text |

### Accent usage rules
- **Только для CTA** (Explore, Start, Open, Send)
- **Активные состояния** (current nav item, hover)
- **Фокус** (focus-visible outline)
- **НЕ использовать** для декоративных элементов, фонов, крупных площадей

## Типографика

### Шрифты
- **Inter** — основной (400/500/600/900 weights)
- **JetBrains Mono** — технические лейблы (fallback: monospace)

### Иерархия
| Tier | Font | Size | Weight | Letter-spacing | Usage |
|---|---|---|---|---|---|
| Display | Inter | `clamp(3rem, 8vw, 7rem)` | 900 | -0.03em | Hero titles |
| H1 | Inter | `clamp(2rem, 5vw, 4rem)` | 800 | -0.02em | Section titles |
| H2 | Inter | `clamp(1.5rem, 3vw, 2.5rem)` | 700 | -0.01em | Subsection |
| Body | Inter | 1rem | 400 | 0 | Paragraphs |
| Small | Inter | 0.875rem | 500 | 0 | Meta text |
| Label | Inter | 0.7rem | 600 | 0.25em | Eyebrow, num, uppercase |
| Mono | JetBrains Mono | 0.75rem | 500 | 0.05em | Code, technical |

## Голос бренда

### Принципы
1. **Короткие предложения.** Одна мысль — одна строка.
2. **Технические термины без объяснений.** WebGPU, TSL, GLSL — без расшифровки.
3. **Глаголы действия.** Explore, Start, Open, Send — не "Learn more".
4. **Тихая уверенность.** Без восклицательных знаков. Без "We are the best".
5. **Минимум слов.** Каждое слово несёт смысл. Нет воды.

### Примеры

**Хорошо:**
- "Glass · motion · light — powered by WebGPU."
- "We don't build what everyone builds."
- "Remote · EU · since 2019."

**Плохо:**
- "We are a passionate team of creative professionals dedicated to crafting..."
- "Our mission is to deliver cutting-edge solutions that..."
- "With years of experience in the industry..."

### CTA библиотека
- `Explore` → переход на детальную страницу
- `Start` → начало процесса (contact, project)
- `Open` → открытие overlay/modal
- `Send` → отправка формы
- `Play` → запуск видео/аудио

## Визуальный язык

### Принципы
1. **Тёмная тема как default.** Inverse (light) — опционально.
2. **Минимализм, не пустота.** Много воздуха, но каждый элемент осмыслен.
3. **Контраст.** Чёрный фон + белый текст + lime accent = драма.
4. **Motion как интерфейс.** Движение = обратная связь, не декорация.
5. **Glass aesthetic.** Прозрачность, blur, глубина — стекло как метафора.

### Компоненты
- **Кнопки:** pill (border-radius 100px), border 1px, accent на hover
- **Карточки:** rounded (12px), subtle shadow, tilt on hover
- **Dropbar:** backdrop-blur, cover previews для works
- **Modal:** fullscreen, backdrop blur, accent controls
- **Cursor:** custom (noisy circle + spring wobble), states for play/drag/view

### Motion
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` для органичных переходов
- **Duration:** 0.3s (fast), 0.5s (medium), 0.8s (slow)
- **Stagger:** 0.15s между элементами в группе
- **Reduced motion:** все анимации отключаются, instant

## Манифест через стиль

> Мы не строим то, что строят все.
> Мы решаем другие задачи.
> Стекло, движение, свет — наш язык.
> Технология как искусство. Тишина как уверенность.

Этот манифест выражается через:
- **Тёмная палитра** — тишина, фокус
- **Lime accent** — энергия, акцент на главном
- **Glass cube** — прозрачность, глубина, технология
- **Минимум слов** — уверенность, не нуждающаяся в объяснениях
- **Motion** — жизнь, дыхание, присутствие
