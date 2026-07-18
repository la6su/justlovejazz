# Studio Console theme evolution

## Goal

Make `studio-console/` the project theme for one WebGPU studio interface.
Quantum Flares and Vibe remain read-only donor layers during migration; UIkit
continues to provide the component and accessibility foundation.

## Constraints

- Keep `master-quantum-flares/` and `master-vibe/` immutable vendor/reference
  snapshots.
- UIkit owns component behavior; project Less owns only visual tokens and
  missing layout patterns.
- Preserve self-hosted Onest Variable, Cyrillic coverage, CRT frame, native
  vertical navigation and reduced-motion behavior.
- Do not restore Vibe's glitch loops, body texture, remote fonts or baked
  background imagery.

## Phases

1. **Foundation — complete.** Add the `studio-console/` boundary, one dual
   signal token pair and static technical edges on existing story/navigation
   modules. New shared visual work now lands there.
2. **Controls.** Audit button, icon-button, menu and overlay states. Migrate
   only one pattern at a time to UIkit variables/hooks or the new layer.
3. **Editorial surfaces.** Bring Blog and Lab modules into the same surface
   grammar without forcing their content into the home layout.
4. **Removal pass.** Delete superseded Quantum Flares overrides and duplicate
   selectors only after visual and interaction parity is proven; leave UIkit
   component imports and behavior in place.

## Acceptance criteria for every phase

- One recognizable dark console language at desktop and 390 px mobile.
- No additional persistent animation, renderer work or background owner.
- UIkit state, focus, keyboard operation and inverse/reduced-motion behavior
  remain intact.
- Build output and the required local checks stay within existing budgets.
