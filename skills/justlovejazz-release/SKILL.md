---
name: justlovejazz-release
description: Verify and publish a scoped JUSTLOVEJAZZ change through its local quality gate, Conventional Commit, non-default branch, push, and pull request. Use when preparing a commit, PR, release handoff, or final pre-publication verification.
---

# JUSTLOVEJAZZ release

Review the working tree first and isolate the intended change from unrelated
user work. Match verification to the affected surface, then run the complete
gate before opening a pull request:

```bash
bun run format:check
bun run lint
bun run type-check
bun run build
bun run test:unit
bun run test
```

Inspect the final diff and `git diff --check`. Work from a scoped non-default
branch, stage only the intended files and use a concise Conventional Commit.
Push the branch and open a pull request against `main`.

Treat CI and review as evidence about the same scoped outcome. Resolve failures
at their source and keep unrelated cleanup outside the release.
