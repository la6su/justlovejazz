# AGENTS.md — LLM entry point. Read first.

> Studio-grade 3D portfolio. Vite 8 + TypeScript strict + Three.js 0.184 + TSL + UIkit 3 + YooTheme Pro (Quantum Flares). Multi-page: splash → app → blog → landing.

## Architecture

```
/            → index.html (splash, ~15KB inline, FCP-critical)
/app         → app.html (3D experience, 6 cube-face sections)
/app/services → services content page (6 sections, cube-map layout)
/app/manifesto → manifesto content page (6 sections, cube-map layout)
/blog        → blog.html (prerendered semantic HTML, SEO)
/blog/[slug] → 4 articles (BlogPosting JSON-LD)
/landing     → landing.html (no-JS fallback, semantic HTML5)
```

## Docs (priority order)

| File | Content | Read when |
| --- | --- | --- |
| [STATUS.md](docs/STATUS.md) ⭐ | Canonical state | **Always first** |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, render path, sections | Structure |
| [RULES.md](docs/RULES.md) | Hard rules (49 rules) | Before changing code |
| [UIKIT3.md](docs/UIKIT3.md) | UIKit theming patterns + lessons | UI/theme changes |
| [CHANGELOG.md](docs/CHANGELOG.md) | Recent changes | History |

## Language

User: Russian. Code/commits/docs: English.

## Sections (6 — 1:1 with cube faces)

| Idx | Section | Cube face | 3D content | Theme |
| --- | --- | --- | --- | --- |
| 0 | Lab (secret left) | Top (+Y) | — (clean) | light |
| 1 | Intro (start) | Front (+Z) | SplashCube + particles | light |
| 2 | About | Right (+X) | — (clean) | dark |
| 3 | Works | Back (-Z) | BakuCarousel + DrawTrail + particles | dark |
| 4 | Contact | Bottom (-Y) | — (clean) | light |
| 5 | Process (secret right) | Left (-X) | — (clean) | dark |

World starts on **section 1 (Intro)**. Lab (0) and Process (5) are secret — reachable only via horizontal joystick drag. Same layout on ALL pages (home, services, manifesto): 0=secret, 1=intro(start), 2-4=main, 5=secret.

## Content pages (3)

| Route | Page | Slider labels (idx 1-4) |
| --- | --- | --- |
| `/app` | home | Intro, About, Works, Contact |
| `/app/services` | services | Intro, Capabilities, Stack, Process |
| `/app/manifesto` | manifesto | Intro, Principles, Craft, Process |

## Navigation — JoystickNav (pure DOM, NOT three-joystick)

| Action | Behavior (ALL pages) |
| --- | --- |
| Vertical down | 1→2→3→4 (main cycle) |
| Vertical up | 4→3→2→1 |
| Horizontal left | → 0 (secret) |
| Horizontal right | → 5 (secret) |
| From secret, opposite | → middle |
| Keyboard | ArrowUp/Down/Left/Right, Home (→1), End (→4) |

## Theme — 2 modes (auto/inverse)

| Mode | Behavior |
| --- | --- |
| `auto` (default) | Global LIGHT — uk-light on body, dark text on light bg |
| `inverse` | Global DARK — no uk-light, light text on dark bg |

YooTheme Pro inverse approach — global flip, NOT per-section. `localStorage('jlz:theme')`. EnvSphere syncs: auto→Intro pattern (light), inverse→About pattern (dark). Toggle: 1 button in UIMenu.

## QF theme principle

`_import.less` §3 sets `@global-primary-background: @jlz-color-accent` (1 line). QF + UIKit globals manage ALL component styling (buttons, cards, navbar, glitch, glow). Do NOT override `@button-*`, `@card-*`, `@navbar-*` — let QF do its job. Custom styles only for what QF/UIKit don't provide (cursor, joystick, dock, text-shadow).

## Key rules (see RULES.md for full 49)

1. No raw ShaderMaterial — TSL NodeMaterial only
2. `setAnimationLoop` — not rAF
3. `scene.background` — NOT set. EnvSphere is sole background
4. Never remove SplashCube (baku)
5. Single font: Inter
6. On-demand rendering: `_needsRender` flag, event-driven
7. CSS imports use `?inline` suffix
8. `server.hmr: false` + `block-vite-client` plugin
9. Always verify: `bun run lint && type-check && build && test:unit`

## Verification

```bash
bun run lint         # 0 errors (warnings tracked)
bun run type-check   # 0 errors (strict + noUncheckedIndexedAccess)
bun run build        # ~3s
bun run test:unit    # 19 tests
```
