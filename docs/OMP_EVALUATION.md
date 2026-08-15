# OMP Worker evaluation

This is a ten-task calibration, not a project memory store. Raw execution
telemetry is written without prompt or response content to the ignored
`.agent-runtime/omp-metrics.jsonl`. Durable project truth remains in source,
tests, `AGENTS.md`, ADRs, architecture and `NEXT.md`.

## Hypothesis

A fresh bounded OMP invocation with a stable system prefix is more reliable and
cheaper than carrying a long conversational session. A new memory or indexing
dependency is justified only by measured retrieval failures.

The vLLM snapshot before the experiment reports prefix caching enabled, 267,696
cached tokens from 369,700 queried tokens (72.4% aggregate hit rate), zero
external-cache use and zero idle KV-cache occupancy. Keep the stable gateway
system prefix and task-packet field order unchanged during the experiment.

The second S0 task added 1,516 queried tokens and zero cache hits. The resolved
cache block is 1,584 tokens, so this micro-task was smaller than one reusable
block. Do not pad short packets for cache eligibility; evaluate cache savings
only on naturally larger S1 tasks.

## Task tiers

| Tier | Intended work                                          | Context target | Retry policy                       |
| ---- | ------------------------------------------------------ | -------------: | ---------------------------------- |
| S0   | classification, bounded comparison, structured rewrite |    2–8K tokens | one simplified retry               |
| S1   | inventory, references, focused failure triage          |   8–16K tokens | one correction with narrower reads |
| S2   | later mechanical edit in an enforced worktree          |   8–24K tokens | stop on scope or test ambiguity    |

Architecture, security decisions, renderer design, dependency admission,
destructive actions and cross-owner refactors remain Queen tasks. Worker tasks
have one objective, one owner boundary, three to eight primary files at most and
a requested answer normally below 800 tokens. The Worker hard ceiling is 32K
tokens; larger work is split or handled by the Queen.

## Scorecard

|   # | Task                     | Tier | First pass | Retry | Queen result       | Note                                                                             |
| --: | ------------------------ | ---- | ---------- | ----: | ------------------ | -------------------------------------------------------------------------------- |
|   1 | `memory-minimum-review`  | S0   | fail       |     1 | usable after retry | first output imitated a disabled file tool; simplified five-line contract passed |
|   2 | `routing-classification` | S0   | pass       |     0 | accepted           | exact three-line routing contract; 1.1 s gateway duration                        |
|   3 | pending                  |      |            |       |                    |                                                                                  |
|   4 | pending                  |      |            |       |                    |                                                                                  |
|   5 | pending                  |      |            |       |                    |                                                                                  |
|   6 | pending                  |      |            |       |                    |                                                                                  |
|   7 | pending                  |      |            |       |                    |                                                                                  |
|   8 | pending                  |      |            |       |                    |                                                                                  |
|   9 | pending                  |      |            |       |                    |                                                                                  |
|  10 | pending                  |      |            |       |                    |                                                                                  |

For every task record first-pass acceptance, retries, elapsed time, packet and
output size, protocol compliance, files read, useful findings, false claims and
Queen review time. One failed first pass receives one simpler correction; a
second miss ends delegation without further context spend.

## Memory layers

1. **Durable truth** — source, tests, ADRs, architecture and `NEXT.md`; Git owns
   invalidation.
2. **Task handoff** — objective, base commit, verified facts, blocker and next
   action; expires when accepted, rejected or when the base commit changes.
3. **Execution telemetry** — content-free local JSONL; rotate after the
   ten-task review.
4. **Code index** — optional and rebuildable; never authoritative memory.

Do not store hidden reasoning, secrets, full prompts/responses, generated
bundles, raw logs, copied source or conclusions without file/commit evidence.

## Graphify admission gate

Graphify is a local AST-backed code knowledge graph, not conversational memory.
Do not install it into the workflow yet. Run an isolated, code-only pilot only
if at least three of ten tasks spend over 30% of their time/context discovering
owners or if two tasks fail because imports/call paths could not be found with
targeted repository search.

The pilot must keep `graphify-out/` ignored, disable semantic/API passes, index
one immutable commit and compare five owner/path questions against `rg` and LSP
for recall, latency, context saved and maintenance cost. Adopt it only if it
materially improves at least three questions without lowering correctness. A
graph is invalid immediately when its commit hash differs from the task base.
