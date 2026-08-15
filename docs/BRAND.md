# Brand direction

JUSTLOVEJAZZ presents technology as a dark cinematic world: expressive
variable type, controlled light and deliberate negative space. The tone is
precise rather than sterile.

## Visual intent

- Let the 3D object and the content have separate jobs: the scene establishes
  atmosphere; the DOM carries readable information and actions.
- Use contrast, depth and motion to direct attention, not to fill empty space.
- Treat the accent as a focused interaction signal. It may become a spatial
  field only when it carries story progress or another legible state; avoid
  large decorative color with no narrative job.
- Keep motion purposeful: navigation feedback, state change, material response
  and focus. Honour reduced-motion settings.

The interface derives its palette from the original mark and the selected
paper/ink reference system: warm paper fields, near-black structural planes,
warm-white text and electric yellow as a concentrated interaction signal. A
muted mineral tone may support depth, but does not compete with the yellow.

Treat a diagonal cut as a structural event: a major action, a route handoff or
the edge of one authored surface. Treat a circle as a current-state marker.
Neither motif is a repeated ornament. Frames and rules appear only where they
clarify a functional boundary; hierarchy otherwise comes from scale, space,
depth and motion. A small, local blur can separate a module from an active 3D
scene while the overall interface stays away from frosted-card styling.
References inform composition and motion principles rather than copied product
chrome. Prefer one memorable 3D gesture over several standard UI cards, while
keeping text and primary actions semantic in the DOM.

Runtime colour, typography and spacing values belong to
`src/assets/_import.less` and `src/assets/main.less`; those source files remain
the current implementation truth for tokens and font stacks. During the
Vue/TresJS migration these values move behind one typed token contract; Vue
components, UIkit Less and Three.js materials consume that contract rather
than copying colour, spacing or breakpoint values into component-local code.
The migration must not change the brand merely because ownership changes.
The app's normal visual theme is dark across every section. Inverse remains an
explicit accessibility preference, not a section-by-section art direction.
Console glass must derive its contrast from shared runtime tokens in both
polarities; its accompanying 3D pixel title follows the same effective theme.

## Typography and voice

- Commissioner Variable is the shared display and interface family. Its
  self-hosted Latin/Cyrillic build covers both product languages with `wght`,
  `FLAR`, `VOLM` and `slnt` axes.
- Use variable axes to communicate hierarchy or an actual state transition.
  Keep line-height and tracking stable during the motion, and settle to a
  readable weight. Reduced-motion mode settles without interpolation.
- Technical labels may use the existing system-monospace stack where a true
  fixed-width rhythm adds meaning. Reserve the display family for its natural
  proportional voice.
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
7. Does it preserve the same visual meaning on WebGPU and the forced WebGL
   backend?
8. Is the value owned once, or does this introduce a second token, animation
   or breakpoint source?

## Migration review boundary

Vue owns semantic DOM, copy, focus and accessibility state. TresJS owns spatial
composition and GPU presentation. Neither layer may duplicate the other as a
second readable or interactive surface. A temporary dual implementation is
allowed only behind an explicit migration flag and is removed at the phase
gate recorded in [`MIGRATION_VUE_TRES.md`](MIGRATION_VUE_TRES.md).

Visual acceptance is comparative: capture the current route before its owner
moves, then capture the migrated route at the same viewport, language, theme,
motion preference and renderer backend. Intentional changes require their own
product decision; framework migration alone is not approval for visual drift.
