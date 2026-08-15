# OMP Worker deployment source

This directory is the reviewed source for the forced-command gateway and the
isolated `codex-agent` Qwen model definition on pct104. Deploy both files as a
pair only after preserving an administrator-owned backup of the active files.

The gateway has exactly four accepted operations: `no-tools` or `read-only`,
each with `fast` or `analyze` thinking. No operation grants shell, write,
browser, task delegation, extension, skill or session permissions.

The headless launch uses OMP's `write` approval mode so the allowlisted read
tools can run unattended. It is safe only because the forced gateway supplies
the tool allowlist and omits every write-capable tool.

`fast` uses Qwen thinking `off`; `analyze` uses `medium` via OMP's explicit
thinking flag and Qwen chat-template compatibility. The vLLM server default
remains off; this is deliberately a per-invocation choice. The local MCP bridge
is the only caller that may select one of these operations.

The gateway reads `VLLM_QWEN_API_KEY` only from the root-managed,
`codex-agent`-readable `/etc/omp-worker/vllm-qwen.env` and passes it to OMP
through the process environment; the corresponding `models.yml` entry never
contains a secret. The
vLLM container must also be firewalled to the intended hosts because an API key
does not protect every service endpoint.
