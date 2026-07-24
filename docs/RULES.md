# Engineering rules

These are enforceable project invariants, not a history of past bugs. When an
implementation and this document disagree, inspect the current source and
tests first, then correct the stale document or implementation deliberately.

## Rendering

1. Use Three.js TSL NodeMaterials for project shaders; do not add raw
   `ShaderMaterial`.
2. Drive rendering with `renderer.setAnimationLoop`, not an application-owned
   `requestAnimationFrame` loop.
3. Do not set `scene.background`; `EnvSphere` is the background owner.
4. The renderer mode, DPR cap, tier and post-processing settings must reflect
   the backend that was actually created after WebGPU/WebGL fallback.
5. Keep rendering on demand. A persistent render reason must be explicit and
   end when its animation ends.
6. Keep the ground-plane visibility gated to the contact section in
   `WorldConfig`/`World`.
7. `WorldConfig` is the only source of visible section post-processing values.
   Do not reintroduce independent renderer presets that override them.
8. Keep SplashCube on the shared transparent reflective material until the
   WebGPU post path provides a compatible scene-colour target for physical
   transmission. Do not add screen-space chromatic/refractive effects to
   imitate glass: the cube must remain comparable on WebGPU and WebGL2.

## Startup and routing

1. Keep the inline splash in `index.html`; lazy Three.js loading must not block
   its first paint.
2. Enter stays disabled until `jlz:webgl-ready`. A failure or timeout presents
   an error state, never an enabled Enter button.
3. Preserve the six-section order: Lab, Intro, About, Works, Contact, Menu.
   Do not reintroduce historical `challenge` or `process` identifiers.
   The public Contact finale may occupy the canonical Lab runtime/DOM slot,
   but the stable identifier and `/lab` route contract must remain intact.
4. Treat bare `href="#"` as a local control. Preserve `#section-*` hashes when
   navigating across SPA routes.
5. Keep `World.ensureCarouselInitialized()` idempotent and home-only. Deep-link
   navigation back to home must initialize the carousel exactly once.

## UI, theme and content

1. **UIKit 3 native-first.** Use UIKit utility classes (`uk-flex-*`,
   `uk-grid`, `uk-width-*`, `uk-margin-*`, `uk-text-*`, `uk-position-*`,
   `uk-transition-*`, `uk-hidden`/`uk-visible`) in markup INSTEAD of custom
   `.jlz-*` CSS rules. Do not re-implement in `.jlz-*` what UIKit provides
   out of the box. See [UIKIT3.md](UIKIT3.md) for the solution priority
   order and the full imported component list.
2. **UIKit variable overrides over custom CSS.** Typography, colors,
   spacing, and component-specific styling belong in `_import.less` §3
   (`@global-*`, `@button-*`, `@nav-*`, `@navbar-*`) or
   `console-theme/_import.less`, NOT in `.jlz-*` rules. Use `.hook-*()`
   mixins for component-level visual customization.
3. **Genuinely bespoke CSS only.** Custom `.jlz-*` rules are allowed only
   for: 3D shell (`.jlz-topbar`, `.jlz-console-bar`, `.jlz-storyline`),
   cinematic sheets (`.jlz-menu-overlay`, `[data-contact-footer]`),
   fullscreen overlay (`.jlz-fs-*`), work-card 3D planes
   (`.jlz-work-card*` with `perspective`/`rotateX/Y`), and the cursor
   canvas. Everything else should use UIKit. See
   [PLAN-css-unification.md](PLAN-css-unification.md) for the staged
   minimization plan.
4. Use UIkit 3 for behaviour it already owns (modal, nav/accordion, focus
   and state classes, grid, button, icon, tooltip, slider); do not add
   competing hand-rolled state.
5. The runtime default is the shared dark Studio Console mode; inverse
   remains an explicit accessibility preference and must stay synchronized
   through `ContentReveal` and the 3D layer.
6. All user-visible copy must be translatable unless it is deliberately a
   proper name. Router-driven translation and metadata updates remain the
   only normal update path.
7. Maintain keyboard access and reduced-motion behaviour when changing UI.
   `FullscreenOverlay` must enforce a focus trap and restore focus on close.

## Lifecycle and resource safety

1. Store every global listener and timer in a removable field, then remove or
   clear it in the owning `dispose()`/`destroy()` method.
2. Dispose GPU resources (textures, render targets, geometries and materials)
   when their owner is destroyed.
3. Route replacement must release page-specific listeners and timers before
   replacing the DOM.
4. Typed lifecycle events (`jlz:webgl-ready`, `jlz:webgl-failed`,
   `jlz:section-change`, `jlz:route-change`) must use `eventBus.emit()`; it
   bridges to `window` for existing consumers. Other `jlz:*` events are local
   DOM contracts — use raw `window.dispatchEvent` but do not duplicate a
   typed `EventBus` emission. See [ARCHITECTURE.md](ARCHITECTURE.md) for the
   full event list.
5. Under `prefers-reduced-motion`, any authored animation (cube opener,
   particle burst, camera pulse) must snap to its settled state synchronously
   rather than animating — otherwise `_needsRender` never settles and the
   scene renders continuously, which is the opposite of reduced-motion intent.

## Repository hygiene

1. Use `apply_patch` for source and documentation edits. Preserve unrelated
   work in a dirty tree.
2. Treat `public/basis/` and `references/` as vendored/reference material.
3. Keep active tasks in `NEXT.md`; keep decisions in `WORKLOG.md`; keep
   release summaries in `CHANGELOG.md`. Do not duplicate them.
4. Before a code PR, run the checks in [DEVELOPMENT.md](DEVELOPMENT.md).
5. Publish through a feature branch and pull request; do not push directly to
   `main`.
