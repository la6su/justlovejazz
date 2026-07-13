# justlovejazz

Studio-grade interactive 3D portfolio. Vite 8 (rolldown) + TypeScript (strict).
Three.js 0.184 + WebGPU/WebGL2 + TSL NodeMaterial + UIkit 3 + Less + bun.

## Run

```bash
bun install
bun run dev          # dev server (localhost:5173)
bun run type-check   # tsc --noEmit (strict)
bun run lint         # ESLint
bun run build        # production build
bun run test:unit    # 19 unit tests
bun run format       # Prettier
```

## Architecture

Multi-page: splash → app → blog → landing.

| Route | Page | Description |
| --- | --- | --- |
| `/` | splash | FCP-critical (~15KB inline), config switchers, Enter |
| `/app` | 3D experience | 6 cube-face sections, JoystickNav, SplashCube |
| `/app/services` | services | 6 sections, cube-map layout |
| `/app/manifesto` | manifesto | 6 sections, cube-map layout |
| `/blog` | blog | Prerendered semantic HTML, SEO |
| `/blog/[slug]` | articles | 4 articles, JSON-LD BlogPosting |
| `/landing` | no-JS fallback | Semantic HTML5, UIkit3 + QF theme |

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Vite 8 (rolldown) + TypeScript strict |
| 3D | Three.js 0.184 + TSL NodeMaterial |
| Renderer | WebGPURenderer (WebGPU/WebGL2 auto-fallback) |
| UI | UIkit 3 + Less (master-quantum-flares YooTheme Pro) |
| Navigation | JoystickNav (pure DOM, 2D) + Menu overlay (section 5, UIKit3 accordion) |
| Background | EnvSphere (BackSide sphere + CanvasTexture) |
| Lint | ESLint 9 + Prettier |
| Test | Vitest (19 tests) |
| PM | bun |

## Docs

| File | Content |
| --- | --- |
| [AGENTS.md](AGENTS.md) | **Start here** — LLM entry point |
| [STATUS.md](docs/STATUS.md) ⭐ | Canonical state |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, render path, sections |
| [RULES.md](docs/RULES.md) | 49 hard rules |
| [UIKIT3.md](docs/UIKIT3.md) | UIKit theming patterns + lessons |
| [CHANGELOG.md](docs/CHANGELOG.md) | Recent changes |

## Navigation

- **JoystickNav** (bottom-center, pure DOM): vertical = main sections (1-4), horizontal = secret sides (0=Lab / 5=Menu)
- **Menu overlay** (section 5, joystick right or hamburger click): UIKit3 `uk-accordion` — 6 top items × 4 sub-sections. Hosts the config toolbar (theme toggle sun/moon + sound toggle EQ-bars).
- **Lab overlay** (section 0, joystick left): grid of project experiment cards.
- **Header** (UIkit3 3-zone navbar): lang (left) · logo (center) · hamburger (right). Hamburger opens section 5 (menu overlay).
- **Keyboard**: ArrowUp/Down/Left/Right, Home, End

## Theme

2 modes: `auto` (global light, sun icon) / `inverse` (global dark, moon icon). YOOtheme Pro inverse approach — global flip via `uk-light` on `<body>`. Toggle lives in the menu overlay config toolbar. `localStorage('jlz:theme')`.

## Sound

Default off (user opt-in). Toggle lives in the menu overlay config toolbar — custom 4-bar EQ animation inside UIKit3 `uk-icon-button`. `localStorage('jlz:sound') = 'on' | 'off'`. Dispatches `jlz:sound-toggle` event (Experience.ts listens, mutes AudioSystem + SfxSystem).
