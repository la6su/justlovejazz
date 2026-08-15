# ADR 0002: Adopt TresJS for scene composition

- Status: Accepted with technical gates
- Date: 2026-08-15

## Context

The scene has stable composition boundaries but currently relies on a large
imperative coordinator and manual route resource ownership. TresJS offers a
Vue-compatible scene graph, lifecycle and explicit primitive bridge. The
runtime also has bespoke renderer, post-processing and demand-loop contracts
that a generic example does not prove.

## Decision

Use one persistent TresJS root as the target owner of scene composition. Mount
existing Three.js owners as explicit primitives first, then migrate one bounded
owner at a time. TresJS may become the production owner only after the renderer
and scheduler gates in the migration plan pass.

## Consequences

The migration is not a big-bang declarative rewrite. Primitive resources keep
manual ownership until genuinely recreated by TresJS. There must be one canvas,
renderer and loop driver. TresJS WebGPU support is experimental, so exact
versions are pinned and renderer lifecycle, readiness and loop integration stay
behind representative gates. Failure of a spike blocks cutover and triggers a
remediation loop; it does not silently weaken backend or performance contracts.
