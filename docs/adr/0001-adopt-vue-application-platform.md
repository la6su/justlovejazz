# ADR 0001: Adopt Vue as the application platform

- Status: Accepted
- Date: 2026-08-15

## Context

The public router replaces HTML strings and manually rebinds translation,
metadata, UIkit and feature listeners. The Page Builder has substantial
selection, history, inspector and preview state. These are component lifecycle
and state-management problems rather than renderer problems.

## Decision

Use Vue 3 for the public application and Page Builder, and Vue Router as the
sole public navigation/history owner. Keep the early inline splash outside the
Vue mount. Prerender semantic route content and load the browser-only scene
host lazily.

## Consequences

Route templates become SFCs, DOM cleanup follows component lifecycle and route
metadata comes from one manifest. Vue does not own Three.js resources and does
not move the splash into its dependency graph. The migration needs component,
router, hydration and accessibility tests.
