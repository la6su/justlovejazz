# STORYBOARD — Section Layout Schema

> Apple Watch-inspired: minimal space, 3D always visible, TUI-like CLI aesthetics.
> Each section = one cube face. 6 faces per page. 3 pages total.

## Layout Pattern (every section)

```
┌─────────────────────────────────────┐
│  TOP: eyebrow + title + meta        │  ← compact header (1-2 lines)
│  uk-text-meta + uk-heading + text   │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         3D CENTER (cube)            │  ← SplashCube + EnvSphere, always visible
│         transparent overlay         │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  BOTTOM: UI detail panel            │  ← expandable, slides up
│  (cards / grid / slider / list)     │
└─────────────────────────────────────┘
```

- **TOP**: ≤2 lines. Eyebrow label (uk-text-meta uppercase) + title (uk-heading) + optional 1-line lead.
- **3D CENTER**: Always visible through transparent `.uk-position-cover`. Cube rotates to face.
- **BOTTOM**: UI panel that can expand/collapse. Contains YOOtheme builder elements.
- **Mobile-first**: TOP and BOTTOM shrink on small screens, 3D stays central.

## TUI-like Styling

```
┌─ EYEBROW ──────────────────────────┐
│  > SECTION_LABEL                    │  ← monospace, uppercase, accent color
├─────────────────────────────────────┤
│  TITLE                              │  ← heading, large
│  brief description text             │  ← 1 line, muted
├─ ═════════════════════════════════ ┤
│                                     │
│          [ 3D CUBE ]                │
│                                     │
├─ DETAIL PANEL ─────────────────────┤
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐          │  ← cards/grid/slider
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │          │
│  └───┘ └───┘ └───┘ └───┘          │
└─────────────────────────────────────┘
```

- Monospace font for eyebrows/labels (uk-text-meta with font-family override)
- Single-line border accents (border-top: 1px solid accent)
- Terminal cursor `>` prefix on section labels
- Scanline overlay (subtle, CSS repeating-linear-gradient)
- Minimal color: accent (#515d84) on dark/light bg

---

## Cube Net (unfolded)

```
              ┌──────────┐
              │  FACE 0  │
              │  Lab     │
              │  (top)   │
              │  light   │
┌──────────┐  ├──────────┤  ┌──────────┐
│  FACE 5  │  │  FACE 1  │  │  FACE 2  │
│  Process │  │  Intro   │  │  About   │
│  (left)  │  │  (front) │  │  (right) │
│  dark    │  │  light   │  │  dark    │
└──────────┘  ├──────────┤  └──────────┘
              │  FACE 3  │
              │  Works   │
              │  (back)  │
              │  dark    │
              ├──────────┤
              │  FACE 4  │
              │  Contact │
              │  (bottom)│
              │  light   │
              └──────────┘
```

Navigation: vertical joystick cycles Face 1→2→3→4 (main), horizontal toggles Face 0 (Lab) ↔ center ↔ Face 5 (Process).

---

## PAGE: HOME (`/`)

6 sections = 6 cube faces. BakuCarousel only on Face 3 (Works).

### Face 0 — Lab (secret left, light)

```
┌─ > LAB ─────────────────────────────┐
│  Experiments & R&D playground       │
├─────────────────────────────────────┤
│                                     │
│         [ particles + cube ]        │
│                                     │
├─ LAB CARDS ─────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐ │
│  │ ◈    │ │ ◉    │ │ ⬡    │ │ ⁂  │ │
│  │Shader│ │Audio │ │ Gen  │ │GPU │ │
│  └──────┘ └──────┘ └──────┘ └────┘ │
└─────────────────────────────────────┘
```
- TOP: `> LAB` + lead text
- 3D: particles (makeParticles, light blue-grey)
- BOTTOM: 4 uk-card grid (uk-child-width-1-2@s)
- UIKit: uk-card-default, uk-card-hover, uk-grid-small

### Face 1 — Intro (front, light, START)

```
┌─ > WEB DESIGN STUDIO · est. 2019 ───┐
│  l@6                                 │
│  glass · motion · light · WebGPU     │
├─────────────────────────────────────┤
│                                     │
│         [ SplashCube center ]       │
│                                     │
├─ CTA ───────────────────────────────┤
│  [ Services ]  [ Work ]  [ Contact ]│
│  ↓ Spin the cube ↓                  │
└─────────────────────────────────────┘
```
- TOP: hero title (uk-heading-xlarge) + lead + meta
- 3D: SplashCube (glass cube, central)
- BOTTOM: 3 uk-button-small + scroll hint
- UIKit: uk-button-primary/default, uk-button-small

### Face 2 — About (right, dark)

```
┌─ > ABOUT ───────────────────────────┐
│  WebGPU · Three.js · TSL · UIkit    │
├─────────────────────────────────────┤
│                                     │
│    [ WireframeTypography + cube ]   │
│                                     │
├─ STATS ─────────────────────────────┤
│  ┌─────┐ ┌──────┐ ┌────┐           │
│  │ 7+  │ │ 40+  │ │ 12 │           │
│  │Years│ │Projs │ │Awds│           │
│  └─────┘ └──────┘ └────┘           │
└─────────────────────────────────────┘
```
- TOP: title + tech stack meta
- 3D: WireframeTypography + particles
- BOTTOM: 3 stat cards (uk-grid-small uk-child-width-1-3)
- UIKit: uk-heading-medium, uk-text-meta, uk-grid

### Face 3 — Works (back, dark, BakuCarousel)

```
┌─ > SELECTED WORK ───────────────────┐
│  Six interactive experiences        │
├─────────────────────────────────────┤
│                                     │
│    [ BakuCarousel ring of cards ]   │
│    ← drag to spin →                 │
│                                     │
├─ PROJECT OVERLAY ───────────────────┤
│  (fullscreen overlay on card click) │
└─────────────────────────────────────┘
```
- TOP: eyebrow + title + drag hint
- 3D: BakuCarousel (cube morphs into ring of project cards)
- BOTTOM: #project-overlay (fullscreen, hidden until click)
- UIKit: uk-position-z-index, ProjectOverlay component

### Face 4 — Contact (bottom, light)

```
┌─ > CONTACT ─────────────────────────┐
│  Let's build something extraordinary│
├─────────────────────────────────────┤
│                                     │
│         [ particles + cube ]        │
│                                     │
├─ CTA BUTTONS ───────────────────────┤
│  hello@justlovejazz.com             │
│  [📧 Start a project] [GitHub] [🐦] │
└─────────────────────────────────────┘
```
- TOP: title + lead
- 3D: particles (light off-white bg)
- BOTTOM: email link + 3 uk-button-large
- UIKit: uk-button-primary/default, uk-button-large, uk-icon

### Face 5 — Process (secret right, dark)

```
┌─ > PROCESS ─────────────────────────┐
│  Discover · Design · Develop · Ship │
├─────────────────────────────────────┤
│                                     │
│         [ particles + cube ]        │
│                                     │
├─ TIMELINE ──────────────────────────┤
│  01  Discover  Research, audit      │
│  02  Design    Art direction, 3D    │
│  03  Develop   WebGPU, TSL, perf    │
│  04  Ship      Launch, measure      │
└─────────────────────────────────────┘
```
- TOP: title + lead
- 3D: particles (deep blue-black)
- BOTTOM: uk-list-divider with 4 timeline items
- UIKit: uk-list, uk-list-divider, uk-flex

---

## PAGE: SERVICES (`/services`)

6 sections. No BakuCarousel — cube stays as glass cube. Content sections unique.

### Face 0 — Intro (light)

```
┌─ > SERVICES ────────────────────────┐
│  What We Build                      │
│  From shader art to shipping product│
├─────────────────────────────────────┤
│            [ glass cube ]            │
├─ (no bottom panel) ─────────────────┤
└─────────────────────────────────────┘
```

### Face 1 — Services List (dark)

```
┌─ > WHAT WE BUILD ───────────────────┐
├─────────────────────────────────────┤
│            [ glass cube ]            │
├─ SERVICE LIST ──────────────────────┤
│  01  WebGPU Experiences             │
│  02  Spatial Design                 │
│  03  Interaction Design             │
│  04  Shader Art                     │
└─────────────────────────────────────┘
```
- BOTTOM: uk-list with big numbers (uk-h3 muted + uk-h4 title)

### Face 2 — Stack (dark)

```
┌─ > STACK ───────────────────────────┐
│  The toolbox                        │
├─────────────────────────────────────┤
│            [ glass cube ]            │
├─ STACK GRID ────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐   │
│  │ 3D & Shader │ │ UI & Eng    │   │
│  │ Three.js    │ │ UIkit 3     │   │
│  └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
```
- BOTTOM: uk-grid uk-child-width-1-2@m

### Face 3 — Process Steps (dark)

```
┌─ > HOW WE WORK ─────────────────────┐
├─────────────────────────────────────┤
│            [ glass cube ]            │
├─ TIMELINE ──────────────────────────┤
│  01  Discover  Research, audit      │
│  02  Design    3D, prototypes       │
│  03  Develop   WebGPU, TSL          │
│  04  Ship      Launch, measure      │
└─────────────────────────────────────┘
```
- BOTTOM: uk-list-divider timeline

### Face 4 — Contact (light)

```
┌─ > LET'S TALK ──────────────────────┐
│  Got a project?                     │
├─────────────────────────────────────┤
│            [ glass cube ]            │
├─ CTA ───────────────────────────────┤
│  [ Start a project → ]              │
└─────────────────────────────────────┘
```
- BOTTOM: uk-button-primary uk-button-large

### Face 5 — Values (dark)

```
┌─ > VALUES ──────────────────────────┐
│  Craft over speed                   │
├─────────────────────────────────────┤
│            [ glass cube ]            │
├─ PRINCIPLES ────────────────────────┤
│  Depth over surface.                │
│  One engagement at a time.          │
└─────────────────────────────────────┘
```
- BOTTOM: uk-text-lead principles

---

## PAGE: POSTS (`/posts`)

6 sections. No BakuCarousel. Content sections unique.

### Face 0 — Intro (light)

```
┌─ > JOURNAL ─────────────────────────┐
│  Writing                            │
│  Notes from the studio              │
├─────────────────────────────────────┤
│            [ glass cube ]            │
├─ (no bottom panel) ─────────────────┤
└─────────────────────────────────────┘
```

### Face 1 — Latest Posts (dark)

```
┌─ > LATEST ──────────────────────────┐
├─────────────────────────────────────┤
│            [ glass cube ]            │
├─ POST GRID ─────────────────────────┤
│  ┌──────────┐ ┌──────────┐         │
│  │ Shaders  │ │ Process  │         │
│  │ TSL...   │ │ Browser  │         │
│  ├──────────┤ ├──────────┤         │
│  │ Perf     │ │ WebGPU   │         │
│  │ Idle...  │ │ Bust     │         │
│  └──────────┘ └──────────┘         │
└─────────────────────────────────────┘
```
- BOTTOM: uk-grid-small uk-child-width-1-2, uk-card with uk-label + date

### Face 2 — Featured (dark)

```
┌─ > FEATURED ────────────────────────┐
│  Why TSL Changes Everything         │
│  The shader stack we've been...     │
├─────────────────────────────────────┤
│            [ glass cube ]            │
├─ CTA ───────────────────────────────┤
│  [ Read full article → ]            │
└─────────────────────────────────────┘
```
- BOTTOM: uk-button-default

### Face 3 — Categories (dark)

```
┌─ > TOPICS ──────────────────────────┐
│  By category                        │
├─────────────────────────────────────┤
│            [ glass cube ]            │
├─ CATEGORY GRID ─────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │ ◈  │ │ ◉  │ │ ⬡  │ │ ⁂  │      │
│  │Shdr│ │Proc│ │Perf│ │WGPU│      │
│  └────┘ └────┘ └────┘ └────┘      │
└─────────────────────────────────────┘
```
- BOTTOM: uk-grid-small uk-child-width-1-4@m, uk-card with icon + label

### Face 4 — Contact (light)

```
┌─ > WANT MORE? ──────────────────────┐
│  Follow the studio or reach out     │
├─────────────────────────────────────┤
│            [ glass cube ]            │
├─ CTA ───────────────────────────────┤
│  [ Get in touch → ]                 │
└─────────────────────────────────────┘
```

### Face 5 — Archive (dark)

```
┌─ > ARCHIVE ─────────────────────────┐
│  Older notes                        │
├─────────────────────────────────────┤
│            [ glass cube ]            │
├─ NOTE ──────────────────────────────┤
│  Short-form writing going back      │
│  to 2019. Experiments, rants,       │
│  breakthroughs.                     │
└─────────────────────────────────────┘
```

---

## Theme Map

```
Face   Section   Theme    Bg Pattern
─────  ────────  ──────   ─────────────────
0      Lab       light    blue-grey HSV
1      Intro     light    white HSV
2      About     dark     grey gradient
3      Works     dark     blue-grey gradient
4      Contact   light    off-white gradient
5      Process   dark     deep blue-black
```

Inverse mode flips: light→dark, dark→light.

## UIKit Builder Elements Used

| Element | Where | UIKit classes |
|---------|-------|---------------|
| uk-card | Lab cards, post cards, category cards, team cards | uk-card-default uk-card-body uk-card-hover |
| uk-grid | Lab (1-2@s), Stats (1-3), Posts (1-2), Categories (1-4@m) | uk-grid-small, uk-child-width-* |
| uk-list | Process timeline, services list | uk-list uk-list-divider |
| uk-button | CTA buttons, Enter button | uk-button-primary/default, uk-button-small/large |
| uk-heading | Section titles | uk-heading-medium/xlarge |
| uk-text-meta | Eyebrows, descriptions | uk-text-meta uk-text-uppercase |
| uk-icon | Social, drag hints, sound | uk-icon="icon: ..." |
| uk-label | Post categories | uk-label |
| uk-position | 3D overlay, project overlay | uk-position-cover, uk-position-z-index |
| uk-height-viewport | Section sizing | uk-height-viewport="expand: true" |
| uk-section | Section padding | uk-section-small uk-section-medium@s uk-section-large@m |
| uk-scrollspy | Reveal animations | uk-scrollspy="cls: uk-animation-fade" |
| uk-slider | Home nav | uk-slider (in UIMenu) |
| uk-modal | Menu modal | uk-modal |
| uk-flex | Layout | uk-flex uk-flex-column uk-flex-between |

## File Structure

```
src/sections/           ← unified: 3D scene + HTML template per cube face
├── _shared/            ← constants, footer, makeParticles
├── lab/                ← face 0 (scene.ts + template.ts + index.ts)
├── intro/              ← face 1
├── about/              ← face 2
├── works/              ← face 3 (BakuCarousel — home only)
├── contact/            ← face 4
└── process/            ← face 5

src/pages/              ← page renderers
├── index.ts            ← renderPage() router
├── home.ts             ← home (aggregates 6 sections)
└── content/
    ├── services.ts     ← services (6 unique sections)
    └── posts.ts        ← posts (6 unique sections)
```
