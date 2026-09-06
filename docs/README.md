# Documentation map

Keep each fact with the source that owns it:

| Source                                                         | Purpose                                           |
| -------------------------------------------------------------- | ------------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                             | Stable boundaries and runtime contracts           |
| [archive/MIGRATION_VUE_TRES.md](archive/MIGRATION_VUE_TRES.md) | Completed migration record and acceptance history |
| [adr/](adr/)                                                   | Durable architecture decisions                    |
| [DEVELOPMENT.md](DEVELOPMENT.md)                               | Setup, verification and performance budgets       |
| [PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md)             | Comparable delivery/runtime evidence              |
| [BRAND.md](BRAND.md)                                           | Visual and editorial direction                    |
| [PAGE_BUILDER.md](PAGE_BUILDER.md)                             | Dev-only UIkit builder and compile boundary       |
| [CHANGELOG.md](CHANGELOG.md)                                   | Released user-visible or operational changes      |
| [evidence/](evidence/)                                         | Machine-readable gate reports and visual evidence |
| [agents/](agents/)                                             | Private agent-operation workflow (no credentials) |
| [../NEXT.md](../NEXT.md)                                       | Open outcomes                                     |
| [../skills](../skills)                                         | Procedures loaded for matching tasks              |

`docs/` is the project reference layer. Agent-operation procedures live in
the repository skills and the private homelab runbooks, not in the migration
record. Historical evidence is preserved under `archive/` and `evidence/`.

Current source, configuration and tests lead when documentation drifts.
Accepted ADRs explain why durable boundaries exist; `NEXT.md` is the only
active outcome queue. `WORKLOG.md` remains historical context rather than a
required session log. The vendored reference source under `references/` was
removed from the repository; upstream next.junni.co.jp remains the credited
design lineage.
