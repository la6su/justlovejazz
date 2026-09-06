# Console theme

The public interface is a neuro console — a terminal-frame TUI around an
authored 3D exhibition. Strategy-game references inform instrument hierarchy,
measured spacing and state signals; they do not introduce imitation game
chrome.

## Ownership

`src/assets/_import.less` assembles both the application and blog theme:
`console-theme/mixins.less` (canonical TUI primitives, imported first), brand
tokens, UIkit variables, `console-theme/_import.less`, component mappings and
hooks, `console-theme/components.less`, UIkit component sources, then the
generated builder overrides. `main.less` adds the assembly and route
composition only; `components/_console-language.less` is the single owner of
persistent console chrome (topbar, control banks, menu sheet, status island,
boot gates) and is imported last; `components/_fullscreen.less` owns the
fullscreen project overlay. The removed `_theme.less` must not be
reintroduced as a second override layer.

The builder compiler owns `builder/theme.generated.less` and
`builder/components.generated.less`. Change generated settings through the
builder/compiler, never by hand. This is a UIkit Less custom theme with the
YOOtheme section/container/component approach, not a WordPress theme install.

## Visual contract

- Cool near-black surfaces, ivory text, yellow emphasis and phosphor secondary
  interaction signals. Blue belongs to spatial context; status colors retain
  their semantic meaning (ember is the failure voice).
- Commissioner carries headings and prose. Mono carries controls, indices and
  technical metadata (`.jlz-meta-text()` keeps one terminal voice). Large
  headings use natural case; metadata stays quiet.
- Square controls, fine functional borders, no UI glow or decorative scanlines.
  Frames separate controls or information; they do not enclose every section.
- The TUI frame (`.jlz-tui-frame()`) is the terminal bezel identity: four
  phosphor corner ticks drawn by one pseudo-element on chrome instruments —
  the control banks, cinematic sheets and boot gates. A live key lights its
  bank's bezel to full phosphor (`:has()`); no extra DOM is added for chrome.
- The top menu bank and bottom navigation island share one flat analog-button
  language (`.jlz-control-bank()` / `.jlz-bank-key()`): square housing,
  shallow bevel, one-pixel press offset and a single phosphor state color.
  Channel meaning is carried by compact SVG glyphs instead of labels that
  force the control group wider.
- System readouts speak with a blinking block cursor
  (`.jlz-blink-cursor()`, e.g. the topbar mode); reduced motion holds the
  cursor steady. Terminal scrollbars (hairline thumb, phosphor on hover)
  identify scrollable console panes.
- Failure states use the shared boot gate (`.jlz-boot-gate*`): mono readout,
  ember signal head, `ERR:` code line and one square retry action. The splash
  3D gate and the pre-CSS shell fallback mirror the same composition.
- Keyboard focus is explicit (`.jlz-focus-ring()`, phosphor). Core icon
  targets are 44 pixels; language, theme and sound remain available on
  mobile. Reduced motion settles scene changes.
- UIkit owns component behavior, including accordion, list, form and button
  foundations. Application selectors own camera-aligned scene compositions.

## Polarity and scene

All authored sections start dark. Inverse is an explicit user preference.
`ContentReveal.isLight` provides the effective initial polarity to `Experience`;
subsequent changes use the typed event bus. Scene code must not read a body class
to infer this state. The existing `uk-light` projection is a historical custom
inverse contract, not a reason to infer UIkit's default semantics in scene code.

`EnvSphere` supplies the cool pavilion palette; `WorksInstallation` owns the
finite spatial transitions around the featured media. One shared renderer and
animation loop remain responsible for all rooms. DOM text and actions remain
available independently of the exhibit geometry.

On a case route the installation also receives the selected project index. Its
assembly changes mode for the project and chapter: Ebb Vibes keeps open rings,
Mono Sunday compresses into a quiet instrument, Nocturne Blue widens the
signal field, and archive projects use the remaining authored variants. This
is a scene contract, not a decorative randomizer; each mode is deterministic
and reduced motion snaps to the same target.

Manifesto is the system's briefing room. Each principle pairs a proposition
with a working protocol and an observable consequence; the ink stage remains a
quiet pointer-responsive field behind that reading layer. The route uses the
same four-section cinematic contract as Works, but its navigation moves from
principle to principle rather than from project to project.

## Verification and next work

The static CRT perimeter is `public/crt-frame.svg`, applied by `_crt.less`.
It curves the screen boundary without distorting readable DOM content or
requiring a second renderer. It stays visible under reduced motion and is
removed in forced-colors and print modes. Native WebGPU post still owns bloom,
grading, vignette and refraction; WebGL's direct renderer does not run that
graph. Shader grain is spatially stable and refraction follows authored
strength, so unrelated demand frames do not introduce time jumps. Optional
shader border strength now blends continuously instead of using a binary gate.

UIkit's console glyph registry uses a shared 20-unit grid with 1.5px square-cap
strokes and currentColor. The logo retains its recognizable internal mark with
the current palette and a clipped rectangular enclosure.

Check fresh direct-route entry through the splash, normal/inverse preference,
keyboard navigation, narrow mobile layouts and route-to-route transitions.
Run Vue type checking, unit tests and the production build after shared theme
changes. Hardware WebGPU and forced WebGL require separate visual checks;
successful compilation does not establish backend parity.

The active scene and case-study roadmap is maintained in [NEXT.md](../NEXT.md).
