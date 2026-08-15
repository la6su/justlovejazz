#!/usr/bin/env bash

set -euo pipefail

source /opt/vllm/.venv/bin/activate

MODEL_PATH="/mnt/models/nvfp4/Qwen3.8-27B-NVFP4"
MODEL_NAME="Qwen3.8-27B-NVFP4"

: "${VLLM_API_KEY:?VLLM_API_KEY must be set through the systemd EnvironmentFile}"

exec vllm serve "${MODEL_PATH}" \
  --served-model-name "${MODEL_NAME}" \
  --tensor-parallel-size 1 \
  --trust-remote-code \
  --language-model-only \
  --host 192.168.10.106 \
  --port 8000 \
  --gpu-memory-utilization 0.93 \
  --kv-cache-dtype fp8_e4m3 \
  --max-model-len 128000 \
  --max-num-seqs 2 \
  --max-num-batched-tokens 8192 \
  --attention-backend flashinfer \
  --enable-prefix-caching \
  --enable-chunked-prefill \
  --enable-auto-tool-choice \
  --speculative-config '{"method":"mtp","num_speculative_tokens":1}' \
  --generation-config vllm \
  --default-chat-template-kwargs '{"enable_thinking": false}' \
  --tool-call-parser qwen3_coder \
  --reasoning-parser qwen3 \
  --uvicorn-log-level warning
