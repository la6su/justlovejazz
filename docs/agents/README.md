# Agent workflow

Read AGENTS.md, NEXT.md and AGENT_HANDOFF.md first. Load only the task's relevant
skill and source. Architecture, evidence and release commands are linked from
[the documentation map](../README.md).

## User-friendly execution

- One outcome at a time; keep a working application after every slice.
- Handle authorized edits, checks and scoped Git delivery without repeatedly
  asking the user to copy commands. Use supported sandbox approvals when needed.
- Report what changed, verification and the next step briefly.
- Preserve unrelated dirty files. Never mistake sandbox read-only errors for
  stale lock files. Never delete git locks blindly.

## Context and usage

- Use targeted rg searches; do not reload migration archives every turn.
- Keep tasks in NEXT.md and only the current checkpoint in AGENT_HANDOFF.md.
- Run deterministic scripts for formatting, tests, budgets and browser checks.
  Read failure summaries first; retain detailed logs as artifacts.
- Full release gate once per delivery, focused checks while editing.
- No recurring model polling of unchanged CI or speculative parallel agents.
- Model choice is explicit and environment-dependent. A lighter model and a
  smaller context reduce consumption but cannot guarantee avoiding account limits.
- If delegation is requested, give a bounded task and a short checkpoint,
  not the complete conversation; isolate concurrent writes.

## Infrastructure boundary

Homelab topology and wrapper paths are environment-specific, not repository
requirements. The old DSH/pct104 examples remain in Git history; do not execute
them as verified current setup. Credentials and machine runbooks stay private.
