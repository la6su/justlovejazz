# OMP Worker deployment source

This directory is the reviewed source for the forced-command gateway and the
isolated `codex-agent` Qwen model definition on pct104. Deploy both files as a
pair only after preserving an administrator-owned backup of the active files.

The gateway has exactly four accepted operations: `no-tools` or `read-only`,
each with `fast` or `analyze` thinking. No operation grants shell, write,
browser, task delegation, extension, skill or session permissions.

`fast` resolves to Qwen thinking `off`. `analyze` resolves to `medium` through
OMP's Qwen chat-template compatibility. The vLLM server default remains off;
this is deliberately a per-invocation choice. The local MCP bridge is the only
caller that may select one of these operations.

The gateway reads `VLLM_QWEN_API_KEY` only from the root-managed,
`codex-agent`-readable `/etc/omp-worker/vllm-qwen.env` and passes it to OMP
through the process environment; the corresponding `models.yml` entry never
contains a secret. The
vLLM container must also be firewalled to the intended hosts because an API key
does not protect every service endpoint.
