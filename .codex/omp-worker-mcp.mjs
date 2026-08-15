#!/usr/bin/env node
/* global clearTimeout, process, setTimeout */

import { spawn } from 'node:child_process'
import { homedir } from 'node:os'

const SERVER = {
  name: 'justlovejazz-omp-worker',
  version: '1.0.0',
}

const MAX_PROMPT_CHARS = 48_000
const MAX_OUTPUT_CHARS = 64_000
const DEFAULT_TIMEOUT_SECONDS = 300
const MAX_TIMEOUT_SECONDS = 300

const sshArgs = [
  '-F',
  `${homedir()}/.ssh/config`,
  '-i',
  `${homedir()}/.ssh/id_ed25519_omp_worker`,
  '-o',
  'IdentitiesOnly=yes',
  '-o',
  'BatchMode=yes',
  '-o',
  'StrictHostKeyChecking=yes',
  '-o',
  'User=codex-agent',
  'hermes',
]

let inputBuffer = ''
let queue = Promise.resolve()

process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  inputBuffer += chunk
  let newline = inputBuffer.indexOf('\n')

  while (newline >= 0) {
    const line = inputBuffer.slice(0, newline).trim()
    inputBuffer = inputBuffer.slice(newline + 1)
    if (line) queue = queue.then(() => handleLine(line)).catch(writeInternalError)
    newline = inputBuffer.indexOf('\n')
  }
})

async function handleLine(line) {
  let message
  try {
    message = JSON.parse(line)
  } catch {
    return
  }

  if (message.method === 'notifications/initialized') return

  if (message.method === 'initialize') {
    respond(message.id, {
      protocolVersion: message.params?.protocolVersion ?? '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: SERVER,
    })
    return
  }

  if (message.method === 'tools/list') {
    respond(message.id, {
      tools: [
        {
          name: 'omp_consult',
          title: 'Consult isolated OMP Worker',
          description:
            'Run one bounded, read-only JUSTLOVEJAZZ task on local Qwen through the isolated pct104 worker.',
          inputSchema: {
            type: 'object',
            additionalProperties: false,
            required: ['task_id', 'prompt'],
            properties: {
              task_id: {
                type: 'string',
                minLength: 3,
                maxLength: 80,
                pattern: '^[a-z0-9][a-z0-9._-]+$',
              },
              prompt: {
                type: 'string',
                minLength: 1,
                maxLength: MAX_PROMPT_CHARS,
              },
              repository_read: {
                type: 'boolean',
                default: false,
                description: 'Enable only read, grep, glob and lsp tools.',
              },
              timeout_seconds: {
                type: 'integer',
                minimum: 30,
                maximum: MAX_TIMEOUT_SECONDS,
                default: DEFAULT_TIMEOUT_SECONDS,
              },
            },
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
          },
        },
      ],
    })
    return
  }

  if (message.method === 'tools/call') {
    if (message.params?.name !== 'omp_consult') {
      respondError(message.id, -32602, 'Unknown tool')
      return
    }

    const args = message.params.arguments ?? {}
    try {
      const output = await consult(args)
      respond(message.id, { content: [{ type: 'text', text: output }] })
    } catch (error) {
      respond(message.id, {
        isError: true,
        content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
      })
    }
    return
  }

  if (message.id !== undefined) respondError(message.id, -32601, 'Method not found')
}

function consult(args) {
  const taskId = String(args.task_id ?? '')
  const prompt = String(args.prompt ?? '')
  const timeoutSeconds = Math.min(
    MAX_TIMEOUT_SECONDS,
    Math.max(30, Number(args.timeout_seconds) || DEFAULT_TIMEOUT_SECONDS),
  )

  if (!/^[a-z0-9][a-z0-9._-]{2,79}$/.test(taskId)) {
    throw new Error('task_id must be 3–80 lowercase letters, digits, dots, underscores or dashes')
  }
  if (!prompt || prompt.length > MAX_PROMPT_CHARS) {
    throw new Error(`prompt must contain 1–${MAX_PROMPT_CHARS} characters`)
  }

  const taskPacket = [
    `task_id: ${taskId}`,
    'role: worker',
    'authority: Queen owns architecture, integration and acceptance',
    'write_scope: none',
    '',
    prompt,
    '',
    'Required ending: No files changed.',
  ].join('\n')

  const remoteCommand = args.repository_read ? 'consult-read-only' : 'consult-no-tools'

  return new Promise((resolve, reject) => {
    const child = spawn('ssh', [...sshArgs, remoteCommand], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let exceeded = false

    const append = (current, chunk) => {
      const next = current + chunk
      if (next.length > MAX_OUTPUT_CHARS) {
        exceeded = true
        child.kill('SIGTERM')
        return next.slice(0, MAX_OUTPUT_CHARS)
      }
      return next
    }

    child.stdout.on('data', (chunk) => {
      stdout = append(stdout, chunk.toString())
    })
    child.stderr.on('data', (chunk) => {
      stderr = append(stderr, chunk.toString())
    })
    child.stdin.end(taskPacket)

    const timer = setTimeout(() => child.kill('SIGTERM'), (timeoutSeconds + 10) * 1000)
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (exceeded) {
        reject(new Error(`OMP output exceeded ${MAX_OUTPUT_CHARS} characters`))
        return
      }
      if (code !== 0) {
        reject(new Error(`OMP Worker exited with ${code}: ${stderr.trim() || 'no diagnostic'}`))
        return
      }
      resolve(stdout.replace(/^Working\.\.\.\s*/u, '').trim())
    })
  })
}

function respond(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`)
}

function respondError(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } })}\n`)
}

function writeInternalError(error) {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
}
