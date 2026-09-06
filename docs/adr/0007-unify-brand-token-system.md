# ADR 0007: Unify the brand system on one identity and token chain

- Status: Accepted
- Date: 2026-08-21

## Context

The visual identity had drifted from its token contract. The canonical palette
lived in `src/assets/_import.less` §1, but parallel sources of color
accumulated: the admin editor used its own 60+ ad-hoc hex values, the console
theme declared its own status colors, the paper-ink language and the scene
cursor carried hard-coded brand hues, and the saved builder document
(`src/builder/generated/page.json`) re-declared a third palette that the Less
assembly resolves last. The result was one brand described in four places,
with the product look actually owned by the builder artifact.

The product decision (owner-approved) is a new identity, **Neon Stage**: a
cool near-black stage, cool ivory text, one concentrated electric accent,
a cool second signal and an ember error signal; inverse is a cool paper
polarity. Radii adopt a 6–10px control language. Responsive behavior stays
mobile-first, and the type scale becomes a golden-ratio (φ = 1.618) modular
chain.

## Decision

One token chain, one value per fact:

1. `src/assets/_import.less` §1 is the single canonical source: the Neon
   Stage palette, semantic status tokens (`color-status-success` plus
   `warning`/`danger` aliases to the brand signals) and the 6–10px radius
   language. `radius-full` keeps its small value (dot usages).
2. `src/core/brandTokens.ts` mirrors §1 key-for-key and value-for-value
   (parity test). Count moves from 84 to 87 with the three status tokens.
3. `src/assets/console-theme/_import.less` takes its status colors from the
   brand status tokens and its heading scale from the φ chain
   (0.875 / 1.414 / 2.288 / 3.702 / 6rem, rem-based and mobile-first; html
   font-size 0.85rem on mobile → 1rem on desktop scales the whole chain).
   Display sizes beyond h1 remain `clamp()` compositions in `_content.less`.
4. The builder default (`src/builder/style.ts`) and the committed document
   (`src/builder/generated/page.json`) are re-themed to Neon Stage and the
   generated Less is regenerated through the compiler, so the saved document
   and the brand describe the same palette.
5. Every parallel color source is removed: paper-ink language, scene cursor
   fallbacks, admin editor and stale dead fallbacks now reference the token
   chain. The admin editor paints from `--jlz-*` runtime variables only; no
   ad-hoc hex remains in `admin/admin.less`.

## Consequences

- The brand changes visibly (product, blog, admin, scene accents). This is an
  intentional product decision, not migration drift.
- Any new color must enter §1 first; component-local hex is a review failure.
- The saved builder document remains the last Less authority for component
  variables; changing the brand therefore touches §1, the manifest, the
  builder defaults and the committed document in the same change.
- The φ type scale changes heading sizes; visual QA compares before/after at
  the same viewport and theme.
