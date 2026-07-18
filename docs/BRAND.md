# Brand direction

JUSTLOVEJAZZ presents technology as a dark cinematic console: precise type,
framed imagery, controlled light and deliberate negative space. The tone is
technical rather than loud.

## Visual intent

- Let the 3D object and the content have separate jobs: the scene establishes
  atmosphere; the DOM carries readable information and actions.
- Use contrast, depth and motion to direct attention, not to fill empty space.
- Treat the accent as a focused interaction signal. It may become a spatial
  field only when it carries story progress or another legible state; avoid
  large decorative color with no narrative job.
- Keep motion purposeful: navigation feedback, state change, material response
  and focus. Honour reduced-motion settings.

The interface uses dark technical planes, a shared CRT frame and restrained
acid-green/teal signals instead of scanlines or decorative shader fields. A
small, local blur is allowed only where a console module needs separation from
an active 3D scene; it must not turn the overall interface back into frosted
cards. References inform composition and motion principles, not copied product
chrome. Prefer one memorable 3D gesture over several standard UI cards, while
keeping text and primary actions semantic in the DOM.

Runtime colour, typography and spacing values belong to
`src/assets/_import.less` and `src/assets/main.less`. Do not copy hexadecimal
tokens or font stacks here: those source files are the implementation truth.
The app's normal visual theme is dark across every section. Inverse remains an
explicit accessibility preference, not a section-by-section art direction.

## Typography and voice

- Onest Variable is the shared display and interface family. Its self-hosted
  Latin and Cyrillic subsets cover the two product languages with one set of
  metrics and a continuous `wght` axis from 100 to 900.
- Use variable weight to communicate hierarchy or an actual state transition.
  Keep line-height and tracking stable during the motion, and settle to a
  readable weight. Reduced-motion mode must skip the interpolation.
- Technical labels may use the existing system-monospace stack where a true
  fixed-width rhythm adds meaning; do not imitate monospace with the display
  family.
- Prefer short, declarative sentences and concrete verbs.
- Keep one thought per line or sentence when writing display copy.
- Avoid hype, filler, superlatives and exclamation marks.
- Preserve proper project names across languages unless content requires a
  deliberate translation.

The site is the portfolio. Each route should make its subject tangible while
it explains it: show the capability, name the real problem, reveal the response
and leave one piece of proof. Use this as a writing rhythm, not as a visible
numbered checklist or a repeated grid of generic cards.

Useful action words: **Explore**, **Open**, **Start**, **Send**, **Play**.

## Review questions

Before accepting new UI or copy, ask:

1. Does it clarify an action or a story beat?
2. Does it preserve hierarchy at desktop and mobile sizes?
3. Does it work against both section theme polarities?
4. Does its motion communicate state rather than decorate?
5. Is the copy shorter without losing meaning?
6. Does the effect earn its GPU, layout and attention cost?
