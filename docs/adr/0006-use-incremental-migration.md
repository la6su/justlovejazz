# ADR 0006: Use an incremental migration

- Status: Accepted
- Date: 2026-08-15

## Context

The project has intertwined but tested bootstrap, DOM, renderer and scene
contracts. Replacing router, renderer and world composition together would
remove useful rollback points and make regressions difficult to attribute.

## Decision

Use reversible vertical slices with explicit entry/exit criteria. Keep a
compatibility path until its replacement passes. Delete one legacy owner only
after consumer search, tests and runtime evidence prove the new owner.

`tres-vue-dev` is the integration branch. Parallel agents use separate
worktrees and branches and return focused commits; they never concurrently edit
the integration working tree.

## Consequences

Temporary adapters and feature flags are allowed only with named consumers and
a removal phase. Every phase remains runnable, reviewable and independently
revertible. The migration document, traceability ledger and `NEXT.md` must stay
aligned.
