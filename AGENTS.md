# AGENTS.md — LLM entry point. Read FIRST.

> Studio-grade 3D portfolio SPA. Vite 8 · TypeScript strict · Three.js 0.184 + TSL · UIkit 3 + YooTheme Pro (Quantum Flares) · bun.

## TL;DR

Single-page application. **6 SPA routes** (one HTML entry: `index.html`), each with **4 main sections** + 2 secret side sections (6 total = 1:1 with cube faces). 3D canvas + transparent DOM overlay. Three.js loads lazy (non-blocking FCP). Inline splash overlay → Enter click → 3D scene. Blog pages are standalone HTML.

## Docs (priority order)

| File | Content | Read when |
| --- | --- | --- |
| [NEXT.md](NEXT.md) ⭐⭐ | **Concrete backlog — what to do next** | **FIRST — pick a task** |
| [WORKLOG.md](WORKLOG.md) ⭐ | Latest session context (decisions + why) | **SECOND — read top entry** |
| [STATUS.md](docs/STATUS.md) | Canonical state | Third — full current state |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, render path, sections, events | Structure changes |
| [RULES.md](docs/RULES.md) | Hard rules with bug provenance | **Before changing code** |
| [UIKIT3.md](docs/UIKIT3.md) | UIKit theming patterns + lessons | UI / theme changes |
| [CHANGELOG.md](docs/CHANGELOG.md) | Recent changes (latest 2 entries) | History |

## Session workflow (LLM agent)

```bash
./scripts/session.sh start   # Print latest worklog + NEXT.md + git sync state
# ... work on a task from NEXT.md ...
./scripts/session.sh end     # Draft worklog entry from git log
# Edit WORKLOG.md (fill placeholders) + update NEXT.md (check off done items)
./scripts/session.sh push    # Commit + push to GitHub (auto-rebase if behind)
```

**Fresh context checklist:**
1. `./scripts/session.sh start` — get oriented
2. Read `NEXT.md` — pick a TODO item, move to "In Progress"
3. Read `WORKLOG.md` top entry — latest decisions + context
4. Read `RULES.md` — before touching code
5. Work on the task
6. `./scripts/session.sh end` → edit entry → update NEXT.md → `./scripts/session.sh push`

## Architecture

```
index.html → entry-shell.ts → entry-app.ts → main-app.ts → Experience.ts
  ↑ seamless inline splash overlay (SVG squares + progress ring + CRT curtains)
  ↑ three.js loads LAZY (dynamic import) — does NOT block FCP
  ↑ Enter button DISABLED until 3D fully ready (jlz:webgl-ready)
blog.html + blog/*.html → standalone (prerendered semantic HTML, SEO)
```

No separate splash page. No landing page. One HTML entry (`index.html`) with
inline splash overlay that fades out when the 3D scene is ready (Enter click).

## Routes (6 SPA pages)

| Route | Page | Sections (joystick down/up) |
| --- | --- | --- |
| `/` | home (Studio) | 01 Studio / 02 Services / 03 Works / 04 Manifesto |
| `/services` | services | 01 Creative Direction / 02 Interactive Dev / 03 Motion & Realtime / 04 AI Systems |
| `/works` | works | 4 sections × 2 large 3D tilt cards = 8 case studies |
| `/manifesto` | manifesto | 01 Purpose / 02 Clarity / 03 Emotion / 04 Simplicity |
| `/lab` | lab | 01 Shader Lab / 02 Audio Reactive / 03 Generative / 04 GPU Particles |
| `/contact` | contact | 01 Email / 02 Social / 03 Location / 04 Form |

Blog (`/blog` + `/blog/[slug]`) — standalone HTML, NOT part of SPA.

## Sections (6 — 1:1 with cube faces)

| Idx | Section | Cube face | 3D content | Theme |
| --- | --- | --- | --- | --- |
| 0 | Lab (secret left) | Top (+Y) | — (clean) | light |
| 1 | Intro (start) | Front (+Z) | SplashCube + particles | light |
| 2 | About | Right (+X) | — (clean) | dark |
| 3 | Works | Back (-Z) | BakuCarousel + DrawTrail + particles | dark |
| 4 | Contact (bottom) | Bottom (-Y) | Ground plane (ONLY here) | light |
| 5 | Process (secret right) | Left (-X) | — (clean) | dark |

World starts on **section 1 (Intro)**. Lab (0) and Process (5) are secret —
reachable only via horizontal joystick drag. Same layout on ALL pages:
0=secret, 1=intro(start), 2-4=main, 5=secret.

## Navigation — JoystickNav (pure DOM, NOT three-joystick)

| Action | Behavior (ALL pages) |
| --- | --- |
| Vertical down | 1→2→3→4 (main cycle) |
| Vertical up | 4→3→2→1 |
| Horizontal left | → 0 (secret Lab) |
| Horizontal right | → 5 (secret Process) |
| From secret, opposite | → middle (section 1-4) |
| Dotnav | 4 dots — click to jump |
| Keyboard | ArrowUp/Down/Left/Right, Home (→1), End (→4) |

## Theme — 2 modes (auto/inverse)

| Mode | Behavior |
| --- | --- |
| `auto` (default) | Global LIGHT — `uk-light` on body, dark text on light bg |
| `inverse` | Global DARK — no `uk-light`, light text on dark bg |

YooTheme Pro inverse approach — global flip, NOT per-section.
`localStorage('jlz:theme')`. EnvSphere syncs via `jlz:theme-applied`.
Toggle: 1 button in UIMenu (paint-bucket icon).

## i18n — EN/RU

`src/core/i18n.ts` — full EN/RU dictionary (130+ keys).
- `t(key)` — translate a key
- `data-i18n` attributes on elements — auto-translated on load + route change
- `data-i18n-placeholder` — for input placeholder attributes
- `toggleLang()` — EN ↔ RU, persists to `localStorage('jlz:lang')`
- `applyTranslations()` runs in router on every `renderView()` + `jlz:lang-change`
- Key naming: flat dot notation (`home.studio.title`, `services.creativeDirection.lead`, `common.explore`, `meta.works.title`)

## Meta tags — route-based SEO

`src/core/pageMeta.ts` — `applyMetaTags(page)` called on every route change + lang change:
- `<title>`, `<meta name="description">`, `<html lang>`
- Open Graph: `og:title`, `og:description`, `og:url`, `og:site_name`, `og:type`
- Twitter Card: `twitter:card`, `twitter:title`, `twitter:description`
- `<link rel="canonical">`
- All values from i18n dictionary (`meta.<page>.title` / `.description`) — switch language → meta switches too

## Splash flow — Enter button contract

```
HTML parse → inline splash renders (FCP)
  → dynamic import('three') → progress ring fills (15→40→55→85→95→100%)
  → jlz:webgl-ready fires (Experience.init() COMPLETE)
  → Enter button ACTIVATES (.is-ready class — pointer-events:auto, opacity:1)
  → user clicks Enter → jlz:splash-entered → curtains split + SVG scales out
  → bakuCube opener at 400ms → 3D scene
```

**CRITICAL:** The Enter button is ALWAYS visible but DISABLED (`pointer-events:none`,
`opacity:0.5`, `cursor:not-allowed`) until `jlz:webgl-ready` fires. Under CPU/network
throttling, `Experience.init()` can take 10-20s — that's expected. The Enter button
must NEVER activate early — clicking through to an uninitialized scene produces a
broken experience (no carousel, no baku cube, no camera setup). See RULES §50.

If `init()` crashes → `jlz:webgl-failed` → load error shown (NOT Enter).
60s hard fallback → load error (NOT Enter).

## QF theme principle

`_import.less` §3 sets `@global-primary-background: @jlz-color-accent` (1 line).
QF + UIKit globals manage ALL component styling (buttons, cards, navbar, glitch, glow).
Do NOT override `@button-*`, `@card-*`, `@navbar-*` — let QF do its job. Custom styles
only for what QF/UIKit don't provide (cursor, joystick, work cards, text-shadow).

## Key rules (see RULES.md for full list)

1. No raw ShaderMaterial — TSL NodeMaterial only
2. `setAnimationLoop` — not rAF
3. `scene.background` — NOT set. EnvSphere is sole background
4. Never remove SplashCube (baku)
5. Single font: Inter
6. On-demand rendering: `_needsRender` flag, event-driven
7. CSS imports use `?inline` suffix
8. `server.hmr: false` + `block-vite-client` plugin
9. Enter button DISABLED until `jlz:webgl-ready` (never activate early)
10. Ground plane visible ONLY on section 4 (bottom cube face)
11. `data-i18n` on all user-visible text; `applyMetaTags()` on every route + lang change
12. Always verify: `bun run lint && type-check && build && test:unit`

## Language

User: Russian. Code/commits/docs: English.

## Verification

```bash
bun run lint         # 0 errors (warnings tracked)
bun run type-check   # 0 errors (strict + noUncheckedIndexedAccess)
bun run build        # ~3s
bun run test:unit    # 17 tests (EventBus 13 + Noise 2 + motionPolicy 2)
```
