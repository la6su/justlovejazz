# Brand direction

JUSTLOVEJAZZ creates modern, distinctive digital solutions for businesses that
want to stand out through relevance, performance and style. The name evokes
living creativity and freedom of thought; it does not define a music subject,
audience or visual theme.

The approach is directorial: understand the business, audience and available
data; define the intended outcome; orchestrate narrative, design and technology
around it. Automation and optimization support fast delivery and fast products.
Judge choices by business fit, usability, measured performance and craft.

The visual expression is a precise creative console opening into authored
spaces: **tech-hacker TUI character, editorial typography, 3D and tactile motion.**
Omarchy informs system coherence. Each project's business context informs its
story and art direction. The sections below guide design, not implementation status.

## Interface and type

- Use a clear grid, deliberate negative space and compact control groups.
  Thin rules, aligned indices and quiet status labels give the console its
  structure. Frames mark functional boundaries; let the work occupy the space.
- Keep Commissioner for expressive headings and readable prose; use the existing
  mono stack for controls, captions and coordinates. Natural-case headlines,
  restrained uppercase metadata, tabular numbers where values change.
- Refine optical alignment, line breaks, line length and EN/RU rhythm before
  adding decoration. Keep body copy comfortable on mobile; labels must remain
  legible at normal zoom. Variable-font changes should preserve layout stability.
- Dark graphite/ivory is the base. Phosphor signals interaction/focus; yellow
  marks a primary action or editorial emphasis; ember communicates failure.
  Let project media and scene lighting introduce local color. Inverse preserves
  hierarchy and remains an explicit preference.
- Give controls coherent hover, focus, pressed, selected, loading and error
  states. Show real status and useful shortcuts; avoid fabricated telemetry.
  Pointer, keyboard and touch should feel equally intentional.

## Space and transitions

One shared world connects distinct section spaces. These are starting concepts,
not mandatory props or another scene framework:

| Section       | Spatial character                                                 |
| ------------- | ----------------------------------------------------------------- |
| Home          | One sculptural signature and a confident typographic introduction |
| Services      | A precise modular workbench showing how the studio builds         |
| Works / cases | A gallery whose framing, material and light serve each project    |
| Manifesto     | A quiet reading chamber with a restrained ink/light field         |
| Lab           | An experimental bench with a clear entry and return               |
| Contact       | An open, calm destination with an unmistakable next action        |

Develop a recognizable transition gesture: an aperture or material boundary
reveals the next space; controlled displacement/refraction concentrates at
that boundary and settles cleanly. Compose camera, material and DOM handoff as
one movement. Keep text sharp and controls responsive throughout; preserve
spatial direction when going back. The existing showreel slice is a starting
point, not an effect to stamp onto every interaction.

Microinteractions answer input immediately, then settle. Use the existing motion
tokens: `instant/fast` for feedback, `normal/slow` for panels and local reveals,
`cinematic` for spatial handoff. Tune the actual gesture rather than applying
long transitions everywhere. Interrupt/reverse from the current state; avoid
queued animations, repeated intro sequences and motion that delays reading.

Minimalism lives in attention: one dominant gesture at a time, with quiet
supporting detail. Grain, glow, scan or glitch can express a material or event;
use them selectively, not as permanent noise. Reduced motion preserves the same
composition and state without travel/distortion; lower capability keeps the
composition with simpler effects. Sound is optional reinforcement.

## Content and finish

Lead EN/RU copy with the business problem, intended value and specific response.
Within the current case chapters, explain the context/data, directing decisions,
solution and verified outcome. Separate targets from measured results; keep
temporary media/proof labelled. Technical detail supports the story when useful.
Polish the path from understanding the offer to inspecting work and making contact,
including loading, failure, exit and return.
Judge finish by readable type, consistent spacing, stable focus, clean visual
edges, responsive input and a purposeful settled frame.

## Source owners and references

Tokens/UIkit assembly: `src/assets/_import.less` and `src/core/brandTokens.ts`.
Console primitives: `src/assets/console-theme/`; chrome/fullscreen/CRT:
`src/assets/components/`; icons: `src/assets/console-icons.ts`. Builder overrides
come from its schema/compiler. Reuse these owners as the design evolves.

[Omarchy](https://omarchy.org/manual/) informs TUI character and system coherence.
[W3C contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
and [motion guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
anchor readability and motion control; the visual choices above are project art direction.
