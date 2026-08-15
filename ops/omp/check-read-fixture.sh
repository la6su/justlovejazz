#!/usr/bin/env bash

set -euo pipefail

mode="${1:-fast}"
case "$mode" in
  fast | analyze) ;;
  *)
    printf 'usage: %s [fast|analyze]\n' "$0" >&2
    exit 64
    ;;
esac

expected=$'fixture_id: omp-read-001\nengine: qwen-vllm\nauthority: Queen\nNo files changed.'
prompt='Read only `ops/omp/read-fixture.md`. Return exactly four lines: `fixture_id: omp-read-001`, `engine: qwen-vllm`, `authority: Queen`, then `No files changed.` Do not inspect any other path.'

response="$(ssh -T \
  -F "${HOME}/.ssh/config" \
  -i "${HOME}/.ssh/id_ed25519_omp_worker" \
  -o IdentitiesOnly=yes \
  -o BatchMode=yes \
  -o StrictHostKeyChecking=yes \
  -o User=codex-agent \
  hermes "consult-read-only-${mode}" <<<"$prompt")"

# Match the MCP bridge: remove OMP's progress prelude and boundary whitespace,
# while keeping the four contractual content lines exact.
response="${response#Working...$'\n'}"
while [[ "$response" == $'\n'* ]]; do
  response="${response#$'\n'}"
done
while [[ "$response" == *$'\n' ]]; do
  response="${response%$'\n'}"
done

if [[ "$response" != "$expected" ]]; then
  printf 'OMP %s read fixture failed. Received:\n%s\n' "$mode" "$response" >&2
  exit 1
fi

printf 'OMP %s read fixture passed.\n' "$mode"
