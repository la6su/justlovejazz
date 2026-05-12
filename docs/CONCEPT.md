# CONCEPT

## Goal

Cinematic interactive studio portfolio inspired by `junni.co`. Principles over visual imitation:

- World-driven storytelling; scroll as director timeline
- Central 3D object that changes behavior per section
- Camera with inertia, FOV accents, micro-movement
- Staged loading: `pre` → `must` → `sub`
- Post-processing as art direction, not a filter

## Design Principles

1. **System over effect** — every visual serves perception, not just aesthetics
2. **Rhythm over smoothness** — no linear motion; easing + inertia; stagger only for hierarchy
3. **Contrast over decoration** — deep black, technical grey, single accent, asymmetry with optical balance
4. **State-driven UX** — DOM and WebGL share one state source:
   - `scroll → worldState`
   - `pointer velocity → camera/environment response`
   - `active project → camera/detail material transition`
   - `section → lighting/material/post-processing preset`

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

- User understands site structure in 5s
- Transitions feel intentional, not accidental
- 3D scene helps read portfolio, doesn't get in the way
- Page freezes well: a frame looks like a finished poster
- Mobile version designed separately, not just scaled down
