# NAMING — Canonical object & section names (single source of truth)

> Last updated: 2026-07-13. All code, docs, and configs MUST use these names.
> If you find a name NOT in this file, it's a bug — fix it.

## Section index → name mapping (6 sections, 1:1 with cube faces)

| Index | ID (WorldConfig) | domSection | Folder | Scene creator | Cube face | Theme | 3D objects |
|-------|------------------|------------|--------|---------------|-----------|-------|------------|
| 0 | `sec_lab` | `lab` | `sections/lab/` | `createSection0` | Top (+Y) | light | ShaderOrb |
| 1 | `sec_intro` | `intro` | `sections/intro/` | `createSection1` | Front (+Z) | light | SplashCube (baku) |
| 2 | `sec_about` | `about` | `sections/about/` | `createSection2` | Right (+X) | dark | WireframeTypography |
| 3 | `sec_works` | `works` | `sections/works/` | `createSection3` | Back (-Z) | dark | BakuCarousel + JunniParticles |
| 4 | `sec_contact` | `contact` | `sections/contact/` | `createSection4` | Bottom (-Y) | light | WireframeTypography + GroundPlane |
| 5 | `sec_process` | `process` | `sections/process/` | `createSection5` | Left (-X) | dark | TimelineNodes |

### Rules
- **`sec_<name>`** — WorldConfig `id` field (e.g. `sec_works`, NOT `sec_challenge`)
- **`<name>`** — `domSection` field (e.g. `works`, NOT `challenge`)
- **`createSection<N>`** — scene creator function, N = index (0-5, NO gaps)
- **Folder** = `sections/<name>/` (e.g. `sections/works/`, NOT `sections/challenge/`)

## 3D Object names (THREE.Object3D.name)

| Object | name property | Class | File | userData key |
|--------|---------------|-------|------|-------------|
| SplashCube | `baku-cube` | `SplashCube` | `Experience/World/SplashCube.ts` | — (on World.baku) |
| BakuCarousel | `baku-carousel` | `BakuCarousel` | `Experience/World/BakuCarousel.ts` | `userData.carousel` |
| JunniParticles | `particles` | `JunniParticles` | `Experience/World/JunniParticles.ts` | `userData.particles` |
| WireframeTypography | `wireframe-text` | `WireframeTypography` | `Experience/World/WireframeTypography.ts` | `userData.typography` |
| ShaderOrb | `shader-orb` | `ShaderOrb` | `Experience/World/ShaderOrb.ts` | `userData.orb` |
| TimelineNodes | `timeline-nodes` | `TimelineNodes` | `Experience/World/TimelineNodes.ts` | `userData.timeline` |
| EnvSphere | `env-sphere` | `EnvSphere` | `Experience/World/EnvSphere.ts` | — (on World) |
| ParticleBurst | `particle-burst` | `ParticleBurst` | `Experience/World/ParticleBurst.ts` | — (on World) |
| DrawTrail | `draw-trail` | `DrawTrail` | `Experience/World/DrawTrail.ts` | — (on World) |
| GroundPlane | `ground` | `THREE.Mesh` | `core/World.ts` | — (on World) |
| Lights | `cinematic-lights` | `CinematicLights` | `Experience/World/Lights.ts` | — (on World) |

### Rules
- **Class name** = PascalCase (e.g. `SplashCube`, `BakuCarousel`)
- **name property** = kebab-case (e.g. `baku-cube`, `baku-carousel`)
- **userData key** = camelCase, matches the object's role (e.g. `userData.carousel`, NOT `userData.gallery`)
- **World field** = camelCase (e.g. `world.baku`, `world.groundPlane`, `world.particleBurst`)

## Deprecated names (DO NOT USE)

| Old name | Correct name | Where it was | Status |
|----------|-------------|--------------|--------|
| `sec_challenge` | `sec_works` | WorldConfig id | ❌ renamed |
| `challenge` | `works` | domSection | ❌ renamed |
| `createSection4` (works) | `createSection3` | SectionSceneFactory | ❌ renumbered |
| `createSection6` (contact) | `createSection4` | SectionSceneFactory | ❌ renumbered |
| `createSection7` (process) | `createSection5` | SectionSceneFactory | ❌ renumbered |
| `userData.gallery` | `userData.carousel` | World.ts, scene groups | ❌ renamed |
| `junni-particles` (name) | `particles` | JunniParticles.ts | ❌ renamed |
| `wireframe-typography` (name) | `wireframe-text` | WireframeTypography.ts | ❌ renamed |

## Event names (EventBus + window CustomEvents)

All events use `jlz:` prefix. See `src/core/EventBus.ts` for typed events.

| Event | Emitted by | Consumed by |
|-------|-----------|-------------|
| `jlz:webgl-ready` | main-app | entry-app (activate Enter) |
| `jlz:webgl-failed` | main-app | entry-app (show error) |
| `jlz:splash-entered` | inline script | entry-app, Experience |
| `jlz:section-change` | Experience (home) | entry-app, ContentReveal |
| `jlz:page-section-change` | JoystickNav (content) | ContentReveal, entry-app |
| `jlz:route-change` | router | UIMenu, ContentReveal, entry-app |
| `jlz:lang-change` | i18n | router (re-apply) |
| `jlz:theme-change` | ThemeManager | ContentReveal |
| `jlz:theme-applied` | ContentReveal | Experience (EnvSphere + ground + particles) |
| `jlz:open-project` | WorkCards | Experience (ProjectOverlay) |
| `jlz:sound-toggle` | entry-app | Experience (audio + sfx) |

## File naming

| Pattern | Example | Rule |
|---------|---------|------|
| Class file | `SplashCube.ts` | PascalCase, matches class name |
| Scene file | `sections/works/scene.ts` | lowercase, folder = section name |
| Template file | `sections/works/template.ts` | lowercase |
| Test file | `__tests__/i18n.test.ts` | lowercase, matches module name |
| Config file | `WorldConfig.ts` | PascalCase |
| Doc file | `docs/RULES.md` | UPPERCASE.md |

## localStorage keys

All keys use `jlz:` prefix.

| Key | Used by | Values |
|-----|---------|--------|
| `jlz:theme` | ThemeManager | `'auto'` / `'inverse'` |
| `jlz:lang` | i18n | `'EN'` / `'RU'` |
| `jlz:devpanel` | DevPanel | JSON `{ visible: boolean }` |
| `jlz:sound` | entry-app, Experience | `'on'` / `'off'` |
| `jlz:force-cursor` | Cursor | `'1'` (debug) |
