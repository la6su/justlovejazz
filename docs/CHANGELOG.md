# CHANGELOG

## 2026-07-12 — Multi-page architecture + code review fixes

### Architecture
- Multi-page: splash (/) → app (/app) → blog (/blog + /blog/[slug]) → landing (/landing)
- Vite multi-page input (index + app + landing + blog + 4 articles)
- Splash: inline CSS+JS ~15KB, FCP-critical. Config switchers (theme/sound). Enter → /app
- App loader: CRT curtains + progress bar (15→40→55→85→95→100%). 6s timeout fallback
- Landing: prerendered semantic HTML5, UIkit3 + QF theme, no JS-dependent styles
- Blog: 4 articles (2 case studies + 2 process notes), JSON-LD BlogPosting, OG/Twitter meta

### Theme
- 2-mode: auto (global light) / inverse (global dark). YooTheme Pro approach
- ThemeManager: global flip, not per-section. `setAutoTheme()` removed
- EnvSphere: global theme sync (auto→Intro light pattern, inverse→About dark)
- `_import.less`: `@global-primary-background = @jlz-color-accent` (QF anchor)
- Removed: @button-*, @card-*, @progressbar-* overrides (QF handles via @global-*)

### Navigation
- Cube-map layout on ALL pages: 0=secret, 1=intro(start), 2-4=main, 5=secret
- Vertical cycles 1-4, horizontal toggles 0/5 (same as home Lab↔Process)
- Slider nav: per-page labels (PAGE_SLIDER_LABELS), visible on all app pages
- Secret sections removed from UIMenu (hidden = hidden)
- JoystickNav: `_navigateVertical` boundary fix (wasInSide capture)

### 3D
- SplashCube: RoundedBoxGeometry (bevel 0.04) — smooth edges, no aliasing
- CubeCamera restored (512×512) + material.envMap connected
- MSAA 4× on scene WebGLRenderTarget (fixes edge aliasing on WebGL2)
- Opener: scale pulse 1.0→1.3→1.0 (was broken — openerProgress never applied to mesh)
- Particles: removed from 4 sections (kept only Intro + Works)
- EnvSphere: removed per-section changeSection (global theme only)
- BG.ts: deleted (dead computation, bg.color never read)
- DrawTrail: renders on mousemove (Works section, rAF-throttled)

### UI
- Custom cursor: codrops-style (inner dot + noisy circle). Red on hover. Bump on click. Fill on hover. Magnetic snap to center (small elements). Follow mouse on large menu items
- Dock: 2-row bottom bar (tools 70px + footer ~48px) on ALL pages. Joystick 110px, centered
- Subtitles: NoiseText scramble on [data-eyebrow] (merged with old .jlz-eyebrow)
- Services + Manifesto: cube-map layout, mobile-first content, PROCESS_STEPS shared

### Code review fixes (code-review-skill)
- Experience.destroy(): clear window.experience + Experience.instance + cancel rAF
- Dead code: setAutoTheme, jlj:navigate, JoystickNavOptions, UIMenuOptions.sectionLabels
- EventBus: jlz:route-change added to AppEvents

### Ponytail audit (~315 LOC removed)
- Dead presets (sec_flexible/sec_innovative) in PostProcessingManager + Lights
- StateBus: snapshot/hasAnimations/activeAnimations/reset
- DeviceCapability: 6 dead TierConfig fields + 2 dead methods
- makeInstancedParticles: 2 no-ops + World.ts caller
- 6 barrel index.ts files (sections)
- Noise.ts: dead fade/lerp/grad/noise4d (kept organicValue)
- landing.less: removed duplicates with UIKit base
- UIManager: empty init() removed

### Docs
- 8 historical docs removed (AUDIT, STORYBOARD, IMPROVEMENT_PLAN, AUTONOMY, etc.)
- AGENTS/STATUS/RULES/ARCHITECTURE/UIKIT3 rewritten — concise, LLM-optimized
- CHANGELOG trimmed to latest entry

## 2026-07-11 — 8→6 section unification + uk-light theme

- 8→6 sections (Flexible/Innovative removed)
- UIKit native `uk-light` (replaced 50+ LOC custom overrides)
- Mobile-first rem sizing
- BakuCarousel race condition fixes
- Design tokens merged into `_import.less`
