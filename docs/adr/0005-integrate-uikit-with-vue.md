# ADR 0005: Integrate UIkit through Vue lifecycle adapters

- Status: Accepted
- Date: 2026-08-15

## Context

UIkit provides layout, components, focus behavior and accessibility semantics.
The current manual router replaces subtrees and calls global `UIkit.update()`.
Vue and UIkit can conflict if both mutate the same component state or focus
trap.

## Decision

Keep UIkit CSS and the behavior that has an explicit product owner. Wrap each
stateful UIkit component in a narrow Vue adapter that initializes after mount
and destroys before unmount. Vue owns DOM structure; UIkit owns only wrapped
behavior. Do not use global `UIkit.update()` as the steady-state lifecycle.

## Consequences

Modal, nav and accordion adapters need focus, ARIA and remount tests. A
component has one state and focus owner. Removing UIkit JS remains a separate,
measured decision rather than an implicit part of the Vue migration.
