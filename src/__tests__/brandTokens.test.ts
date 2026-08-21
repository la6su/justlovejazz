import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  BRAND_TOKENS,
  BRAND_TOKEN_NAMES,
  BRAND_TOKEN_ALIASES,
  BRAND_TOKEN_PREFIX,
  brandToken,
  isBrandToken,
} from '../core/brandTokens'

// Resolved from the project root (vitest runs from there) rather than
// `import.meta.url` — under the jsdom environment vitest rewrites
// `import.meta.url` in module scope to the dev-server URL, which cannot be
// fed to `readFileSync`.
const LESS_FILE = (() => {
  const cwdPath = resolve(process.cwd(), 'src/assets/_import.less')
  if (existsSync(cwdPath)) return cwdPath
  throw new Error(`Cannot locate src/assets/_import.less (cwd: ${process.cwd()})`)
})()

/**
 * Parse the canonical §1 "DESIGN TOKENS" block of _import.less.
 * Returns token name (without the `@`, i.e. `jlz-*`) → value (trailing `;`
 * stripped; multi-line values joined with single spaces, exactly as Less
 * collapses them).
 */
function parseLessTokens(): Map<string, string> {
  const lines = readFileSync(LESS_FILE, 'utf8').split('\n')
  const tokens = new Map<string, string>()
  let inBlock = false
  let name: string | null = null
  let parts: string[] = []
  const flush = () => {
    if (name !== null) tokens.set(name, parts.join(' '))
    name = null
    parts = []
  }
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.startsWith('// §1.')) {
      inBlock = true
      continue
    }
    if (line.startsWith('// §2.')) {
      flush()
      break
    }
    if (!inBlock || line.startsWith('//') || line === '') continue
    const def = line.match(/^(@jlz-[a-z0-9-]+)\s*:\s*(.*)$/)
    if (def) {
      flush()
      name = def[1]!.slice(1)
      const rest = def[2]!.replace(/;$/, '').trim()
      parts = rest ? [rest] : []
      if (line.endsWith(';')) flush()
      continue
    }
    if (name !== null) {
      const part = line.replace(/;$/, '').trim()
      if (part) parts.push(part)
      if (line.endsWith(';')) flush()
    }
  }
  flush()
  return tokens
}

describe('brand token manifest', () => {
  it('holds exactly the 94 canonical §1 tokens', () => {
    expect(BRAND_TOKEN_NAMES).toHaveLength(94)
    expect(new Set(BRAND_TOKEN_NAMES).size).toBe(BRAND_TOKEN_NAMES.length)
  })

  it('every name carries the jlz prefix', () => {
    for (const name of BRAND_TOKEN_NAMES) {
      expect(name.startsWith(`${BRAND_TOKEN_PREFIX}-`), name).toBe(true)
    }
  })

  it('locks the Neon Stage literals for the core brand facts', () => {
    expect(brandToken('jlz-color-bg')).toBe('#08090b')
    expect(brandToken('jlz-color-text')).toBe('#eef1f5')
    expect(brandToken('jlz-color-accent')).toBe('#ffd60a')
    expect(brandToken('jlz-color-accent-glow')).toBe('rgba(255, 214, 10, 0.35)')
    expect(brandToken('jlz-color-status-success')).toBe('#45d68c')
    expect(brandToken('jlz-ease-entrance')).toBe('cubic-bezier(0.16, 1, 0.3, 1)')
    expect(brandToken('jlz-space-8')).toBe('2rem')
    expect(brandToken('jlz-z-modal')).toBe('2000')
    expect(brandToken('jlz-duration-cinematic')).toBe('800ms')
  })

  it('records every alias and the aliases resolve to the referenced value', () => {
    const expectedAliases = [
      'color-signal-teal',
      'color-signal-teal-muted',
      'color-status-warning',
      'color-status-danger',
      'color-fluid-warm',
      'button-radius',
      'card-radius',
      'form-border',
      'navbar-surface',
    ]
    expect(Object.keys(BRAND_TOKEN_ALIASES).sort()).toEqual([...expectedAliases].sort())
    for (const [alias, target] of Object.entries(BRAND_TOKEN_ALIASES)) {
      const a = brandToken(`${BRAND_TOKEN_PREFIX}-${alias}`)
      const t = brandToken(`${BRAND_TOKEN_PREFIX}-${target}`)
      expect(a, alias).toBeDefined()
      expect(t, target).toBeDefined()
      expect(a).toBe(t)
    }
  })

  it('strict lookup: unknown names are undefined, never a default', () => {
    expect(brandToken('jlz-color-nope')).toBeUndefined()
    // The namespace lesson: names are `jlz-*` token names, not CSS `--` or
    // Less `@` prefixed strings, and not route/PageIds.
    expect(brandToken('--jlz-color-accent')).toBeUndefined()
    expect(brandToken('@jlz-color-accent')).toBeUndefined()
    expect(isBrandToken('jlz-color-accent')).toBe(true)
    expect(isBrandToken('jlz-color-nope')).toBe(false)
  })

  // ── Parity with the Less source of truth ──

  it('the manifest mirrors §1 of _import.less key-for-key', () => {
    const less = parseLessTokens()
    expect(less.size).toBe(94)
    expect([...less.keys()].sort()).toEqual([...BRAND_TOKEN_NAMES].sort())
  })

  it('the manifest mirrors §1 of _import.less value-for-value (aliases resolved)', () => {
    const less = parseLessTokens()
    for (const [name, manifestValue] of Object.entries(BRAND_TOKENS)) {
      const raw = less.get(name)
      expect(raw, name).toBeDefined()
      const expected = raw!.startsWith('@') ? less.get(raw!.slice(1)) : raw
      expect(manifestValue, name).toBe(expected)
    }
  })

  it('every Less alias reference is recorded in BRAND_TOKEN_ALIASES and vice versa', () => {
    const less = parseLessTokens()
    const strip = (s: string) => s.replace(/^jlz-/, '')
    for (const [name, raw] of less) {
      const declared = BRAND_TOKEN_ALIASES[strip(name)]
      if (raw.startsWith('@')) {
        const target = strip(raw.slice(1))
        expect(declared, name).toBe(target)
      } else {
        expect(declared, name).toBeUndefined()
      }
    }
  })
})
