# Queen and OMP worker pipeline

This document defines how Codex and the local OMP agent collaborate on
JUSTLOVEJAZZ. It is an execution protocol, not a source of product or runtime
architecture. `AGENTS.md`, accepted ADRs and the migration plan remain
authoritative.

## Roles

### Queen — Codex

Within work delegated by the user, Codex is the sole worker orchestrator and
integration authority. The user retains final authority over scope, product
decisions, approvals and destructive or external actions. The Queen:

- owns architecture, system design, migration ordering and acceptance gates;
- reads the authoritative source and selects the smallest complete work slice;
- prepares bounded context and a task contract for each worker;
- owns `tres-vue-dev`, final edits, conflict resolution and removal decisions;
- reviews every worker result against source, tests, budgets and current
  official library documentation;
- runs or confirms the final verification and decides whether a result is
  accepted, revised or discarded;
- updates `NEXT.md`, migration ledgers, ADR status and durable documentation.

The Queen does not delegate architectural authority, merge authority, secrets
or permission to expand scope.

### Worker — OMP with Qwen3.8-27B-NVFP4

OMP runs the local Qwen model through vLLM on the RTX 5090. The Worker:

- executes one bounded task packet;
- inspects only the supplied scope and necessary adjacent contracts;
- follows existing source/tests and the packet invariants;
- reports uncertainty or a blocker instead of inventing a new architecture;
- returns structured findings or one focused commit from its own worktree;
- never edits the integration worktree, changes the roadmap, merges, pushes,
  handles secrets or delegates to its own agents unless the packet explicitly
  permits a read-only subtask.

Worker output is evidence, not an accepted decision, until Queen review.

## Transport and security stages

The workstation reaches pct 104 through the SSH alias `hermes`. The durable
worker now runs OMP 17.3.4 as the locked, non-sudo `codex-agent` account from
its own clone at `/home/codex-agent/workspace/justlovejazz`, using a dedicated
Ed25519 key. The root account is not part of the worker workflow.

### Stage A — bootstrap discovery (complete)

- SSH directly to pct 104, not through `pct exec` on the Proxmox host.
- Invoke OMP with `--no-session` and either `--no-tools` or the explicit
  read-only allowlist `read,grep,glob,lsp`.
- Never forward credentials or read OMP/provider auth storage.
- Queen supplies the prompt and consumes plain/structured output.

### Stage B — durable read-only worker (complete)

- use the dedicated unprivileged `codex-agent` account and Ed25519 key;
- keep it outside sudo and privileged container groups;
- use its isolated clone and OMP profile, never root OMP state;
- force the dedicated key through the root-owned `omp-worker-gateway`; the key
  cannot open a shell, forward ports or execute arbitrary commands;
- register the project STDIO bridge in `.codex/config.toml` and expose only
  `omp_consult`, with serialized calls, timeout and output limits;
- keep the two gateway operations fixed: tool-less consultation and the
  `read,grep,glob,lsp` repository-read mode.

Codex supports MCP STDIO and Streamable HTTP. OMP exposes JSONL RPC/ACP, not
MCP, so direct registration of `ssh ... omp --mode rpc` is invalid; the bridge
must either translate protocols or expose a bounded OMP text invocation as the
current bridge does. STDIO over SSH is preferred while there is one client. An
HTTP bridge, if ever needed, binds to loopback and is reached through an SSH
tunnel.

### Stage C — writable worker

Enable only after read-only soak and explicit approval:

- one worktree and branch `agent/pi/<task-id>` per task;
- filesystem write access only inside that worktree;
- explicit tool allowlist; shell access constrained by the wrapper/container;
- no access to the integration checkout, secrets, Docker/LXC sockets or sudo;
- disable outbound network or allowlist only required endpoints; provide no Git
  credential or push-capable remote;
- canonicalize and verify the allowed worktree path and base commit in the
  wrapper, reject symlink escape, and enforce write scope outside the prompt;
- define commit author/signing policy and delete the task worktree after its
  commit is accepted or rejected;
- the Worker returns a commit hash and report; Queen reviews and cherry-picks or
  rejects it.

OMP headless defaults must not be treated as a security boundary. OS account,
filesystem scope, SSH forced command and tool allowlist are the boundary.

The validated consultation launch disables sessions, extensions, skills,
project rules, PTY and title generation, sets `always-ask` explicitly and
supplies the Queen/Worker system contract. The model endpoint configuration
contains no credential. Read tools are enabled only for a task packet that
needs repository inspection. Both a tool-less response and a one-file
read-only inspection have passed end-to-end; an arbitrary SSH command is
rejected by the forced gateway.

`allowed_read_paths` in a task packet is currently an instruction and review
contract, not a gateway-enforced filesystem allowlist. The read-only gateway
can inspect the whole isolated clone, which therefore contains no provider
credentials or project secrets. Stage C may not reuse that advisory boundary
for writes.

### Operator tmux sessions

The Ubuntu workstation provides tmux 3.6 with a persistent `jlz-dev` session in
the local project. pct 104 provides tmux 3.4 with a persistent `jlz-ops`
session in `/root/workspace/justlovejazz`. Attach with
`tmux attach -t jlz-dev` locally or, after a normal operator SSH login,
`tmux attach -t jlz-ops` in the container. These sessions are for human
inspection, vLLM/OMP health and long-running diagnostics.

MCP Worker tasks never run inside this shared session. They remain ephemeral,
bounded gateway invocations so retries, timeouts and context packets are
reproducible and one task cannot inherit another task's terminal state.

## Task packet

Every Worker invocation receives the same compact structure:

```yaml
task_id: phase-owner-purpose
role: worker
base_commit: immutable commit hash
objective: one observable outcome
non_goals:
  - work explicitly outside the slice
invariants:
  - relevant runtime and migration contracts
allowed_read_paths:
  - three to eight primary files or directories
allowed_write_paths:
  - empty for consultation, minimal for implementation
commands:
  - permitted focused checks
acceptance:
  - objective pass/fail conditions
output:
  - required report fields or one commit
stop_conditions:
  - ambiguity, scope expansion, conflicting owner, failing prerequisite
context_budget:
  - maximum working-window target
```

The Queen includes only the relevant ADR excerpt, invariants and current diff.
The Worker discovers adjacent source through allowed read tools rather than
receiving a full repository dump.

## Context-window policy

The observed OMP model window is approximately 131K tokens. Quality and room
for tool results matter more than filling it.

- Target 2–8K tokens for S0 tasks, 8–16K for read-only S1 tasks and 8–24K for
  later mechanical S2 tasks.
- Use a Worker hard ceiling of 32K tokens, about 25% of the available window.
  Split or return the task to the Queen before automatic compaction.
- Keep at least 75% free for tool results, correction, tests and the final
  answer; unused context is not waste.
- Give one task no more than one owner boundary and normally three to eight
  primary files.
- Start a fresh `--no-session` worker for every task. One direct correction is
  a new, simpler packet with the same stable system prefix; a second miss ends
  delegation.
- If the task approaches the ceiling, the Worker returns a handoff containing
  facts learned, files inspected, current hypothesis, unfinished checks and the
  exact next action. The Queen creates a fresh packet.
- Do not paste generated bundles, lockfiles, full logs or whole documentation
  trees. Send targeted excerpts, hashes and failure windows.
- Do not ask the Worker to both redesign architecture and implement it in the
  same context. Architecture remains a Queen decision.

Recommended context allocation:

|      Portion | Purpose                                          |
| -----------: | ------------------------------------------------ |
|         1–3K | stable role, invariant capsule and task contract |
|         2–8K | targeted source discovery                        |
|        2–12K | implementation or analysis                       |
|         1–4K | focused checks and concise output                |
| at least 75% | unused safety and correction capacity            |

vLLM prefix caching is enabled. Preserve the fixed gateway system prompt and
packet field order so fresh tasks can reuse the common prefix without sharing
conversation state. Do not pad a packet merely to chase cache hits.

## Execution protocol

1. **Queen frames** — verify base commit and worktree, select one outcome,
   identify owners, dependencies, risks and checks.
2. **Queen packages** — create the task packet and a minimal invariant/context
   capsule. No secrets or speculative implementation instructions.
3. **Worker acknowledges** — restate objective, allowed scope and stop
   conditions. If they conflict, return blocked before editing.
4. **Worker executes** — inspect, change only allowed files and run focused
   checks. Do not opportunistically refactor adjacent code.
5. **Worker returns** — provide summary, assumptions, files, checks, remaining
   risks and either findings or one commit hash.
6. **Queen reviews** — inspect the diff independently, run proportionate checks,
   compare dependencies/performance and request a focused correction if needed.
7. **Queen integrates** — cherry-pick or reproduce the accepted change, resolve
   ownership conflicts and update plan/ledgers/docs.
8. **Queen closes** — run the phase gate and remove any superseded duplicate
   code or temporary adapter scheduled for that slice.

## Output contracts

### Read-only consultation

```text
Conclusion
Evidence with file/line references
Assumptions
Risks or contradictions
Recommended bounded next action
No files changed
```

### Implementation worker

```text
Outcome
Base and resulting commit hashes
Files changed and why
Checks run with results
Performance/dependency impact
Known limitations
No merge or push performed
```

Thinking traces, provider credentials, full auth/config files and unrelated
repository content are never returned.

## Parallel-work rules

- Parallel workers must have disjoint write sets and independently useful
  outcomes.
- Only Queen edits `tres-vue-dev` directly.
- A shared generated file, package manifest, lockfile, route manifest or
  migration ledger has one writer at a time.
- Renderer and performance reviews may run in parallel with DOM work, but
  renderer implementation waits for its accepted gate.
- Conflicts are resolved by reissuing a fresh packet on the new base, not by
  letting the Worker merge the integration branch.

## Worker performance rubric

The Queen evaluates Worker tasks by:

- correctness against acceptance criteria;
- minimal and non-duplicative code;
- reuse of established owners and platform/library features;
- absence of new dependency or bundle cost without evidence;
- explicit lifecycle and memory ownership;
- focused verification and honest uncertainty;
- context efficiency: useful evidence per token and completion before the 32K
  Worker ceiling.

The first ten delegated tasks follow the measurable calibration in
[OMP_EVALUATION.md](OMP_EVALUATION.md). Graph or vector memory is not admitted
until that evidence demonstrates a retrieval problem rather than a prompting,
scope or model-capability problem.

Fast output that increases architecture duplication, hides memory ownership or
requires a second cleanup task is rejected.
