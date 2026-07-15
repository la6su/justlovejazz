# Worklog

Short, newest-first decisions that help the next maintainer. Do not copy task
inventories or release notes here. Git history retains the detailed record.

---

<!-- WORKLOG:ENTRIES -->

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
