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

## Thinking-mode evaluation

`fast` is the fixed non-thinking control. `analyze` requests per-task Qwen
thinking without changing the server default, tool boundary or fresh-session
contract. Evaluate them on the same accepted task packets before admitting
`analyze` for a task class. Record contract success, factual/owner accuracy,
retries, forbidden pseudo-tool syntax, elapsed time, final-output size and
Queen review time. Do not capture or retain reasoning text.

Admit `analyze` only when it improves task success by at least 10 percentage
points or removes two repeatable complex failures while keeping p95 end-to-end
time within 2× `fast`; otherwise retain `fast` as the default. Keep Ponytail
and all third-party OMP extensions outside this experiment so causes remain
separable.

### Interim verdict — 2026-08-15

`analyze` is **not admitted** to any task class. A paired S0 routing task was
correct in `analyze` but its `fast` control needed one simplified retry. More
importantly, the first S1 run exposed a stale Worker clone; after materializing
the exact base commit, `analyze` still reported a read tool unavailable and
later returned an incorrect first heading for an existing file. The filesystem
check confirmed the clone and file were correct. `fast` read that same heading
correctly, but a broader document-extraction packet was not factual enough to
admit S1 work either.

Keep `fast` limited to tool-less S0 classification with an explicit contract.
Do not add memory, plugins, wider tools or task delegation. Repair and prove
deterministic repository-read accuracy on fixed fixtures before continuing the
ten-task calibration.

The prerequisite is [`ops/omp/check-read-fixture.sh`](../ops/omp/check-read-fixture.sh)
against `ops/omp/read-fixture.md`: `fast` needs three exact consecutive passes
on the same materialized commit. `analyze` is a separate candidate and needs
the same three exact passes before it can re-enter a paired task evaluation.

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
|   3 | `thinking-mode-smoke`   | S0   | pass       |     0 | modes operational | `fast` and `analyze` preserved no-write contract; analyze took ~15 s vs ~4 s fast |
|   4 | `route-policy-pair`     | S0   | mixed      |     1 | fast retry only   | fast drifted into unavailable file reading (2.8 s); analyze was correct (13.5 s) |
|   5 | `worker-clone-freshness`| S1   | fail       |     0 | infrastructure fixed | Worker was on `main`; rematerialized exact `d641b8d` task base              |
|   6 | `policy-docs-pair`      | S1   | fail       |     0 | rejected           | after sync, neither mode produced reliable evidence from the three named docs    |
|   7 | `single-heading-pair`   | S1   | mixed      |     0 | no S1 admission    | fast read the correct heading; analyze said tool unavailable, then hallucinated a heading |
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
