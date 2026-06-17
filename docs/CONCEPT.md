# CONCEPT

## Goal

Build a studio-grade **single-page** portfolio in one coherent visual system:

- shared page template across hash routes;
- route-specific narrative and content;
- dedicated interactive portfolio route (`#/works`);
- 3D transitions and state-driven motion as core language.

## Design Principles

1. **System over effect** — every visual serves perception, not just aesthetics
2. **Rhythm over smoothness** — no linear motion; easing + inertia; stagger only for hierarchy
3. **Contrast over decoration** — deep black, technical grey, single accent, asymmetry with optical balance
4. **State-driven UX** — DOM and WebGL share one state source:
   - `scroll → worldState`
   - `pointer velocity → camera/environment response`
   - `active project → camera/detail material transition`
   - `section → lighting/material/post-processing preset`
5. **Route clarity** — each page has a clear role:
   - `#/` (Home): studio positioning
   - `#/trinity`: method/process system
   - `#/works`: interactive portfolio cases

## Junni Patterns to Adapt

| Pattern | Status |
|---------|--------|
| CameraController: base + cursor delay + FOV offset + shake | FOV Transitions, Arrival Pulse, Handheld Shake |
| World: section camera/baku/post presets | Section-driven State Machine |
| Baku: central object, material/pose/role changes | Section-based Material Sync |
| AssetManager: priority loading `pre`/`must`/`sub` | Contextual Disposal |
| RenderPipeline: SMAA, bloom, composite, grain/vignette | TSL Chain + Bicubic Filtering |
| NoiseText: text micro-animation as accent | --- |

## Anti-Patterns

- Copy Junni assets, text, models, graphics
- Add effects without state or reason
- Mask poor composition with bloom/grain
- Claim production-ready without measurements
- Ship identical desktop/mobile layouts when behavior differs

## Definition of Done

- User understands route purpose in under 5 seconds.
- Works interactions exist only on `#/works` and feel deterministic.
- Transitions are intentional across all routes, not event-noise.
- Mobile-first behavior remains clear and performant.
- Frames read as finished compositions, not placeholder scaffolds.
