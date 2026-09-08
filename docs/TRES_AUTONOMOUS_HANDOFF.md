# Vue/Tres implementation handoff

Use [NEXT.md](../NEXT.md) for the active queue and
[AGENT_HANDOFF.md](../AGENT_HANDOFF.md) for the resume checkpoint.
This file is a stable entry link, not a second execution plan.

Current ownership is summarized in [TRES_FULL_TRANSITION.md](TRES_FULL_TRANSITION.md).
Runtime contracts live in [ARCHITECTURE.md](ARCHITECTURE.md).
Verification commands live in [DEVELOPMENT.md](DEVELOPMENT.md).

The Works characterization/attachment/installation iterations are implemented.
Do not repeat them. Earlier detailed plans remain in Git history. Their claims
about Services being fully declarative and all complex owners being impossible
to migrate were too strong: Services still creates meshes in Vue hooks, and
retention decisions require per-owner evidence.

Keep one renderer, canvas and loop driver. Reuse LazyStage and sceneHost;
do not create another registry. Current priorities are navigation completion,
async cancellation and teardown verification before additional owner migration.
