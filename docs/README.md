# Documentation map

Keep each fact with the source that owns it:

| Source                                             | Purpose                                      |
| -------------------------------------------------- | -------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                 | Stable boundaries and runtime contracts      |
| [MIGRATION_VUE_TRES.md](MIGRATION_VUE_TRES.md)     | Master migration plan and gates              |
| [adr/](adr/)                                       | Durable architecture decisions               |
| [DEVELOPMENT.md](DEVELOPMENT.md)                   | Setup, verification and performance budgets  |
| [PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md) | Comparable delivery/runtime evidence         |
| [BRAND.md](BRAND.md)                               | Visual and editorial direction               |
| [PAGE_BUILDER.md](PAGE_BUILDER.md)                 | Dev-only UIkit builder and compile boundary  |
| [CHANGELOG.md](CHANGELOG.md)                       | Released user-visible or operational changes |
| [../NEXT.md](../NEXT.md)                           | Open outcomes                                |
| [../skills](../skills)                             | Procedures loaded for matching tasks         |

Current source, configuration and tests lead when documentation drifts.
Accepted ADRs explain why durable boundaries exist; `NEXT.md` is the only
active outcome queue. `WORKLOG.md` remains historical context rather than a
required session log.
Vendored material under `public/basis/` and `references/` sits outside this
documentation system.
