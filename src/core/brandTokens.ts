// src/core/brandTokens.ts — Phase 3 pure brand/runtime token manifest.
//
// The canonical design tokens live in `src/assets/_import.less` §1
// ("DESIGN TOKENS (@jlz-* Less variables)") — the single source of truth for
// the Less + CSS custom properties that the console shell consumes. This
// manifest mirrors that block as a typed, framework-neutral record so that:
//
//   - the token set has one machine-readable, unit-tested name (parallel to
//     `worldSlots.ts` and `routeManifest.ts`);
//   - the Phase 5 "generated adapters" target owner (per the traceability
//     ledger: `typed manifest + generated adapters`) can be built without
//     re-declaring values by hand;
//   - scene code (Phase 3 typed ports) can reference brand values without
//     importing Less.
//
// Direction of truth is NOT flipped in this slice: the Less file remains the
// single source of truth and stays in sync by a unit test that parses §1 and
// compares it against this manifest key-for-key and value-for-value. The
// manifest is inert until consumed; no runtime or Less behavior changes here.
//
// Alias note: six tokens in §1 are Less variable references (e.g.
// `@jlz-color-signal-teal: @jlz-color-signal-cool;`). The emitted CSS custom
// properties resolve them to the referenced value at compile time, so this
// manifest stores the RESOLVED value and records the alias relation in
// `BRAND_TOKEN_ALIASES`. That keeps the editorial fact (teal is an alias of
// cool) explicit instead of silently duplicated.
//
// Scope note: `src/assets/builder/theme.generated.less` re-declares a subset
// of these tokens with authored values (the Style Builder's generated
// override layer). It is a build artifact of the dev-only builder, not part
// of the canonical set, and is intentionally outside this manifest.

type Token = string

// ── Color (dark console polarity) ──
const COLOR: Record<string, Token> = {
  'color-bg': '#0c0b0a',
  'color-bg-elevated': '#181513',
  'color-surface': '#12100f',
  'color-surface-hover': '#211d19',
  'color-border': 'rgba(245, 230, 210, 0.13)',
  'color-border-strong': 'rgba(245, 230, 210, 0.28)',
  'color-text': '#f5e6d2',
  'color-text-muted': 'rgba(245, 230, 210, 0.68)',
  'color-text-subtle': 'rgba(245, 230, 210, 0.4)',
  'color-text-inverse': '#09090b',
  'color-accent': '#fff72c',
  'color-accent-hover': '#fffca0',
  'color-accent-glow': 'rgba(255, 247, 44, 0.32)',
  'color-signal-cool': '#c7ad94',
  'color-signal-cool-muted': 'rgba(199, 173, 148, 0.22)',
  // Alias of signal-cool (see BRAND_TOKEN_ALIASES).
  'color-signal-teal': '#c7ad94',
  'color-signal-teal-muted': 'rgba(199, 173, 148, 0.22)',
  'color-signal-ember': '#ff7568',
  // Inverse (light paper) polarity — authored independently by the builder.
  'inverse-bg': '#efe0cc',
  'inverse-surface': '#f8eddf',
  'inverse-text': '#15110e',
  'inverse-text-muted': '#5e554d',
  'inverse-accent': '#4b4000',
}

// ── Typography ──
const TYPOGRAPHY: Record<string, Token> = {
  'font-display': "'Commissioner', -apple-system, BlinkMacSystemFont, sans-serif",
  'font-body': "'Commissioner', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  'font-mono': "'SFMono-Regular', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace",
  'weight-light': '300',
  'weight-regular': '400',
  'weight-medium': '500',
  'weight-semibold': '600',
  'weight-bold': '700',
  // One tracking value across the application; hierarchy uses weight/scale.
  'letter-spacing': '0',
}

// ── Spacing (4px base, rem-based) ──
const SPACING: Record<string, Token> = {
  'space-0': '0',
  'space-1': '0.25rem',
  'space-2': '0.5rem',
  'space-3': '0.75rem',
  'space-4': '1rem',
  'space-5': '1.25rem',
  'space-6': '1.5rem',
  'space-8': '2rem',
  'space-10': '2.5rem',
  'space-12': '3rem',
  'space-16': '4rem',
  'space-20': '5rem',
  'space-24': '6rem',
  'space-32': '8rem',
}

// ── Radius + derived surfaces ──
const RADIUS: Record<string, Token> = {
  'radius-none': '0',
  'radius-sm': '0.125rem',
  'radius-md': '0',
  'radius-lg': '0.125rem',
  'radius-xl': '0.25rem',
  'radius-fluid': '0.25rem',
  'radius-full': '0.125rem',
  // Derived aliases (see BRAND_TOKEN_ALIASES).
  'button-radius': '0',
  'card-radius': '0.125rem',
  'card-shadow': '0 20px 56px rgba(0, 0, 0, 0.42)',
  'form-border': 'rgba(245, 230, 210, 0.13)',
  'navbar-surface': '#0c0b0a',
}

// ── Console interface surfaces ──
const SURFACE: Record<string, Token> = {
  'color-fluid-surface': '#0d0e13',
  'color-fluid-surface-strong': '#171821',
  'color-fluid-border': 'rgba(157, 161, 210, 0.2)',
  'color-fluid-highlight': 'rgba(255, 247, 44, 0.1)',
  'color-fluid-warm': '#fff72c',
  'color-telegram': '#2aabee',
}

// ── Z-index ──
const Z: Record<string, Token> = {
  'z-canvas': '1',
  'z-content': '10',
  'z-nav': '100',
  'z-overlay': '1000',
  'z-modal': '2000',
  'z-toast': '3000',
}

// ── Motion ──
const MOTION: Record<string, Token> = {
  'duration-instant': '80ms',
  'duration-fast': '160ms',
  'duration-normal': '240ms',
  'duration-slow': '400ms',
  'duration-cinematic': '800ms',
  'duration-epic': '1400ms',
  'ease-entrance': 'cubic-bezier(0.16, 1, 0.3, 1)',
  'ease-exit': 'cubic-bezier(0.7, 0, 0.84, 0)',
  'ease-emphasis': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'ease-state': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'ease-cinematic': 'cubic-bezier(0.65, 0, 0.35, 1)',
}

// ── Layout ──
const LAYOUT: Record<string, Token> = {
  'page-max-width': '90rem',
  'page-gutter': '5rem',
  'section-min-height': '100vh',
}

/** The prefix shared by every token name (Less `@` / CSS `--`). */
export const BRAND_TOKEN_PREFIX = 'jlz'

/**
 * Tokens that are aliases of another token in the canonical block. The
 * manifest stores the resolved value; this record preserves the alias
 * relation so it is a documented fact, not a silent duplicate.
 */
export const BRAND_TOKEN_ALIASES: Readonly<Record<string, string>> = {
  'color-signal-teal': 'color-signal-cool',
  'color-signal-teal-muted': 'color-signal-cool-muted',
  'button-radius': 'radius-md',
  'card-radius': 'radius-lg',
  'form-border': 'color-border',
  'navbar-surface': 'color-bg',
}

/** All canonical tokens, flattened: `jlz-<name>` → value. */
export const BRAND_TOKENS: Readonly<Record<string, Token>> = {
  ...Object.fromEntries(Object.entries(COLOR).map(([k, v]) => [`${BRAND_TOKEN_PREFIX}-${k}`, v])),
  ...Object.fromEntries(
    Object.entries(TYPOGRAPHY).map(([k, v]) => [`${BRAND_TOKEN_PREFIX}-${k}`, v]),
  ),
  ...Object.fromEntries(Object.entries(SPACING).map(([k, v]) => [`${BRAND_TOKEN_PREFIX}-${k}`, v])),
  ...Object.fromEntries(Object.entries(RADIUS).map(([k, v]) => [`${BRAND_TOKEN_PREFIX}-${k}`, v])),
  ...Object.fromEntries(Object.entries(SURFACE).map(([k, v]) => [`${BRAND_TOKEN_PREFIX}-${k}`, v])),
  ...Object.fromEntries(Object.entries(Z).map(([k, v]) => [`${BRAND_TOKEN_PREFIX}-${k}`, v])),
  ...Object.fromEntries(Object.entries(MOTION).map(([k, v]) => [`${BRAND_TOKEN_PREFIX}-${k}`, v])),
  ...Object.fromEntries(Object.entries(LAYOUT).map(([k, v]) => [`${BRAND_TOKEN_PREFIX}-${k}`, v])),
}

/** Every canonical token name (`jlz-*`), for exhaustive iteration. */
export const BRAND_TOKEN_NAMES: readonly string[] = Object.freeze(Object.keys(BRAND_TOKENS))

/**
 * The token value for a canonical name. Strict lookup: an unknown name is a
 * caller bug — this never falls back to a default (the routePage lesson).
 */
export function brandToken(name: string): string | undefined {
  return BRAND_TOKENS[name]
}

/** True when `name` is a canonical token name. */
export function isBrandToken(name: string): boolean {
  return name in BRAND_TOKENS
}
