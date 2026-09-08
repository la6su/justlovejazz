# Documentation

Choose the question you need answered. Reading every document is unnecessary.

| Question                              | Source                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| How do I start the project?           | [Project README](../README.md)                                                                    |
| What should we do next?               | [NEXT](../NEXT.md) — the only task queue                                                          |
| Where did the agent stop?             | [Resume checkpoint](../AGENT_HANDOFF.md)                                                          |
| How do I test and release?            | [Development](DEVELOPMENT.md)                                                                     |
| Who owns a runtime responsibility?    | [Architecture](ARCHITECTURE.md)                                                                   |
| What is actually migrated to Tres?    | [Transition status](TRES_FULL_TRANSITION.md)                                                      |
| How should the product look and read? | [Brand](BRAND.md), [theme](THEME.md)                                                              |
| How does the page builder work?       | [Page builder](PAGE_BUILDER.md)                                                                   |
| What rules should an agent follow?    | [AGENTS](../AGENTS.md), [workflow](agents/README.md)                                              |
| Why was a decision made?              | [ADRs](adr/README.md)                                                                             |
| What was measured or released?        | [Evidence](evidence/README.md), [performance](PERFORMANCE_BASELINE.md), [changelog](CHANGELOG.md) |

## Historical references

[Foundational migration](archive/MIGRATION_VUE_TRES.md),
[hybrid experiments](TRES_HYBRID_EXPERIMENTS.md) and
[post-migration audit](TRES_POST_MIGRATION_AUDIT.md) describe their dated state.
They are not active task queues or instructions to repeat completed work.
Older handoff and autonomy-plan URLs remain short pointers for existing links.

## Maintenance rules

- Keep each fact in one place and link to it. Tasks belong only in NEXT;
  handoff contains only unfinished state; architecture contains runtime contracts.
- Update affected documentation with its code change. Remove completed tasks;
  use changelog/evidence only when they add durable information.
- Source and configuration win over prose. Link commands to DEVELOPMENT and
  dependencies to package.json instead of copying lists into multiple guides.
- Evidence names the revision, environment and limitations. A historical PASS
  never proves a later change passed; skipped cases remain skipped.
- Keep dated records intact. Do not rewrite historic measurements as current.
- Agents read AGENTS, NEXT and the small handoff first; load reference headings
  only for the task. Do not create another plan or status file for each session.
- Review local links after moving files. A documentation-only change needs
  formatting/link checks, not a repeated GPU or full browser gate.

Large technical references are intentionally consulted by topic. Further
condensation is queued in NEXT rather than claiming all prose has been verified.
