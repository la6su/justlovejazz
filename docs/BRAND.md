# Brand direction

JUSTLOVEJAZZ presents technology as a calm, cinematic material: glass, motion,
light and controlled negative space. The tone is precise rather than loud.

## Visual intent

- Let the 3D object and the content have separate jobs: the scene establishes
  atmosphere; the DOM carries readable information and actions.
- Use contrast, depth and motion to direct attention, not to fill empty space.
- Treat the accent as a focused interaction signal. It may become a spatial
  field only when it carries story progress or another legible state; avoid
  large decorative color with no narrative job.
- Keep motion purposeful: navigation feedback, state change, material response
  and focus. Honour reduced-motion settings.

The 2026 interface direction combines calm editorial scale with fluid,
frosted islands and a shader-driven narrative line. References inform
composition and motion principles, not copied product chrome. Prefer one
memorable 3D gesture over several standard UI cards, while keeping text and
primary actions semantic in the DOM.

Runtime colour, typography and spacing values belong to
`src/assets/_import.less` and `src/assets/main.less`. Do not copy hexadecimal
tokens or font stacks here: those source files are the implementation truth.
The app's visual theme is per-section and can be inverted by the user; it is
not a permanently dark or permanently light brand mode.

## Typography and voice

- Use the project's Inter-based UI type system. Technical labels may use the
  existing system-monospace fallback where the implementation calls for it.
- Prefer short, declarative sentences and concrete verbs.
- Keep one thought per line or sentence when writing display copy.
- Avoid hype, filler, superlatives and exclamation marks.
- Preserve proper project names across languages unless content requires a
  deliberate translation.

Useful action words: **Explore**, **Open**, **Start**, **Send**, **Play**.

## Review questions

Before accepting new UI or copy, ask:

1. Does it clarify an action or a story beat?
2. Does it preserve hierarchy at desktop and mobile sizes?
3. Does it work against both section theme polarities?
4. Does its motion communicate state rather than decorate?
5. Is the copy shorter without losing meaning?
6. Does the effect earn its GPU, layout and attention cost?
