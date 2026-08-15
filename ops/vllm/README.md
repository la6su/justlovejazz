# vLLM deployment source

These files are the reviewed, secret-free source for pct106. The systemd unit
loads `VLLM_API_KEY` from `/etc/vllm/qwen38.env` (mode `0600`); that file is
host-local and must never enter Git or task packets.

The service binds vLLM only to pct106's private address. The nftables policy
permits the API port only from the OMP Worker (`192.168.10.104`) and the
workstation (`192.168.10.95`), while denying externally reachable vLLM/PyTorch
engine ports. It deliberately keeps the existing general SSH reachability until
the whole container has an independently reviewed default-deny policy.

The server exposes a stable 128K context window; the Worker remains capped at
32K per task. `fast` remains the server default. The OMP gateway may request
`analyze` per task; no server restart is needed for that choice.
