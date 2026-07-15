# Documentation map

This directory is organised by ownership. Do not copy the same facts between
documents: update the owner named below.

| Document                                                       | Owns                                                                  | Update when                                     |
| -------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                             | Runtime topology, routes, UI composition, renderer and event flow     | A module boundary or user-visible flow changes  |
| [RULES.md](RULES.md)                                           | Non-negotiable engineering invariants                                 | A regression establishes a new guardrail        |
| [DEVELOPMENT.md](DEVELOPMENT.md)                               | Local setup, verification, CI and the optional Codex sandbox appendix | Tooling, test scripts or CI change              |
| [UIKIT3.md](UIKIT3.md)                                         | UIkit/Less integration conventions                                    | UI infrastructure or theme assembly changes     |
| [BRAND.md](BRAND.md)                                           | Brand voice and visual intent                                         | Product/design direction changes                |
| [PLAN-showreel-shader-plane.md](PLAN-showreel-shader-plane.md) | The sole active detailed product plan                                 | Its remaining scope changes                     |
| [CHANGELOG.md](CHANGELOG.md)                                   | Concise release-level history                                         | A user-visible or operational release is merged |

Repository-root documents have separate roles:

| Document                    | Owns                                                  |
| --------------------------- | ----------------------------------------------------- |
| [README.md](../README.md)   | Public overview and quick start                       |
| [AGENTS.md](../AGENTS.md)   | Agent operating procedure and documentation ownership |
| [NEXT.md](../NEXT.md)       | Open, prioritised work only                           |
| [WORKLOG.md](../WORKLOG.md) | Short, newest-first decision journal                  |

## Source of truth

When documentation conflicts with implementation, trust the following order:

1. Current source, configuration and automated tests.
2. `RULES.md` for intended invariants.
3. `ARCHITECTURE.md` for the supported system model.
4. `NEXT.md` for future work.
5. `WORKLOG.md` and `CHANGELOG.md` for history only.

`public/basis/README.md` is vendored third-party licensing material and
`references/next.junni.co.jp/README.md` is a read-only reference snapshot.
They are intentionally outside this documentation system.
