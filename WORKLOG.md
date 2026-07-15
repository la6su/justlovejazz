# Worklog

Short, newest-first decisions that help the next maintainer. Do not copy task
inventories or release notes here. Git history retains the detailed record.

---

<!-- WORKLOG:ENTRIES -->

## 2026-07-16 — WebGPU/WebGL glass and typography parity

### Decision

Removed a duplicate post-processing preset layer that overrode `WorldConfig`
and left WebGPU chromatic aberration active. The 3D words now use a compact,
bundled Comfortaa Bold subset with independently floating glyph meshes. The
cube uses a transparent reflective shell plus a CPU-driven jelly deformation
and a cool outline for legibility on light sections. Physical transmission in
the current WebGPU post path samples an incompatible scene-colour target and
turns the cube dark and milky; the shared shell keeps the intended motion and
silhouette consistent on both backends.

### Verification

- Forced WebGPU and WebGL2 captures of the 3D-text section have no RGB fringe,
  runtime errors or material-colour divergence; the cube and individual glyphs
  move between consecutive captures.
- Type-check, lint, production build and the 89-unit-test suite passed.

## 2026-07-16 — Glass-cube backend parity baseline

### Decision

Kept the required WebGL GLSL transmission fallback because the current Three.js
NodeMaterial transmission path calls `getCanvasTarget`, unavailable on
`WebGLRenderer`. Removed its Drei-derived multi-sampling, anisotropic blur and
temporal distortion: those were a second optical model, not a renderer
equivalent. The fallback now uses one restrained sample and the same physical
parameters, PMREM and motion intent as WebGPU.

### Verification

- Type-check, lint and production build passed; the 89-unit-test suite passed.
- A forced-WebGL experiment confirmed the shared TSL transmission path fails
  exactly at the unsupported `getCanvasTarget` call, so it was not retained.

## 2026-07-16 — Splash import boundary and performance budgets

### Decision

Isolated Vite's virtual preload helper into its own runtime chunk. Previously,
the helper shared the 3D Experience chunk and made the HTML preload Three.js,
despite the dynamic import in the splash shell. The shell now preloads only its
1.9 KB gzip startup graph; the lazy app bootstrap owns Three.js delivery.

### Verification

- Production `index.html` preloads only `chunk-runtime`; it has no direct
  Three.js, UIkit or World preload.
- Production build, type-check, unit and Playwright suites passed after the
  change.

## 2026-07-16 — UIkit/YOOtheme composition and CI parity

### Decision

Added a project-owned Quantum Flares palette bridge after the selected
variation, keeping the vendored theme untouched while restoring semantic JLZ
tokens for UIkit and QF effects. Documented the same layer ownership and
licensed-theme adoption workflow for future agents. CI now runs the required
Vitest suite before its production build.

### Verification

- The personal `uikit-yootheme-theme` skill passed its validator.
- Workflow YAML parsed successfully; 89 unit tests passed locally.
- Earlier in this session, lint (0 errors), type-check, production build, 89
  unit tests and 7 Playwright tests passed. Repository-wide Prettier remains a
  separate baseline task.

## 2026-07-15 — Documentation consolidation

### Decision

Replaced overlapping status, naming and completed-plan documents with a small
ownership model: source/tests → rules → architecture → backlog → history.
The documentation now reflects the current topbar, two-column menu,
per-section theme and six SPA routes.

### Verification

- Cross-checked routes, UI composition, theme and renderer fallback against
  the current source.
- `prettier --check` passes for all maintained Markdown documentation.
- Lint passed with 0 errors and 57 warnings; type-check, production build,
  89 unit tests and 7 Playwright Chromium tests passed.
- Repository-wide `bun run format:check` currently reports 63 files, including
  files outside this changeset; it is tracked as a separate formatting task.

## 2026-07-15 — Navigation and renderer lifecycle hardening

### Decision

Bare anchors remain local controls, route hashes survive SPA navigation and the
home carousel initialises idempotently after a deep link. Renderer quality data
is refreshed after the final WebGPU/WebGL backend selection.

### Verification

- Browser-verified `/services → /` and carousel initialization.
- Lint, type-check, build and unit tests passed at the time of the change.

## 2026-07-14 — Rendering parity and audit remediation

### Decision

Prioritised material parity, lifecycle cleanup and event-driven rendering after
a broad audit. Detailed findings are intentionally retained in Git commits,
not duplicated in active documentation.
