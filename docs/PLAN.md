# PLAN — Autonomous Improvement Roadmap

> Generated 2026-07-13 after user brief: hardcore cinematic webdesign-3d-studio site with
> neon-lime + black + inverse theme, Bebas Neue/Oswald/JetBrains Mono typography,
> zoom on works section transitions, sound panel with equalizer, custom drag carousel,
> junni-style DrawTrail, wobble cursor.
>
> All items below are tracked in TodoWrite and executed autonomously without questions.

## Brief Audit — Current vs Target

| Aspect | Current | Target | Gap |
|---|---|---|---|
| **Theme** | Dark + inverse (✓ exists) | Neon-lime + black + inverse | Need lime accent pass |
| **Typography** | Inter (sans) | Bebas Neue (display) + Oswald (structure) + JetBrains Mono (code) | Need font swap |
| **Splash cube wobble** | day34 jelly, uWobble=0.70 | Visible smooth elegant jelly | DONE (just tuned) |
| **Zoom on works section** | None | Camera FOV/cube scale pulse on section enter | NEW |
| **Sound panel** | AudioSystem.ts exists (no UI) | Off by default, click toggles mute, animated EQ bars | NEW UI |
| **Custom carousel** | BakuCarousel (cube morph ring) | Add: momentum, rubber-band 0.35x, auto-advance 4.5s, pause hover | ENHANCE |
| **DrawTrail** | Ribbon (energy gradient) | Junni-style: tapered tail with cursor-following particles | REWRITE |
| **Wobble cursor** | Codrops noisy circle | Add wobble (skaltenegger pattern) + fix magnetic | ENHANCE |
| **Camera far=1000** | ✓ (Camera.ts:54) | Preserved | VERIFIED |
| **Naming refactor** | ✓ (createSection0-5, userData.carousel) | Preserved | VERIFIED |
| **RenderPipeline crash guard** | ✓ (line 641) | Preserved | VERIFIED |
| **Post-processing** | ✓ (vignette, refract, border, chromatic) | Preserved | VERIFIED |

## Execution Order (priority)

### Phase 1 — Wobble tune (DONE)
- [x] uWobble 0.50 → 0.70 (visible but elegant)
- [x] SIZE_SCALE 0.05 → 0.07 (visible displacement)
- [x] mat.wobble (WebGL2) synced to 0.70

### Phase 2 — Zoom on works section
- [ ] Camera FOV pulse: 60° → 64° → 60° over 0.8s on works section enter
- [ ] Cube scale pulse: 1.0 → 1.15 → 1.0 over 0.6s (scale.setScalar in update)
- [ ] Implementation: Experience.ts `jlz:section-change` handler → Camera.pulse() + SplashCube.triggerOpener()
- [ ] File: `src/Experience/Experience.ts` (section-change handler), `src/Experience/Camera.ts` (pulse method)

### Phase 3 — Sound panel UI
- [ ] HTML: `<button id="jlz-sound-toggle">` with 4 equalizer bars (spans)
- [ ] CSS: animated bars (height keyframes), muted state = flat bars
- [ ] Logic: click toggles AudioSystem.setMuted(), updates aria-pressed + class
- [ ] Default: muted (audio off), bars flat
- [ ] On unmute: bars animate (CSS animation), AudioSystem.start() if not started
- [ ] File: new `src/UI/SoundPanel.ts`, CSS in `src/assets/main.less`
- [ ] Wire: UIManager.init() creates SoundPanel, Experience.ts exposes audio system

### Phase 4 — Custom carousel enhancements
- [ ] Momentum: track velocity on drag, apply decay after release (vx *= 0.92 per frame)
- [ ] Rubber-band: drag beyond bounds → resistance 0.35x (target = bound + (delta * 0.35))
- [ ] Snap-back: on release beyond bounds, ease back to nearest bound
- [ ] Auto-advance: setInterval 4500ms, advance target by 1 card
- [ ] Pause on hover: pointerenter clears interval, pointerleave restarts
- [ ] File: `src/Experience/World/BakuCarousel.ts` (add momentum + rubber-band + auto-advance)
- [ ] Existing: drag/touch already work (pointer events), just add physics

### Phase 5 — DrawTrail junni-style rewrite
- [ ] Reference: `references/next.junni.co.jp/src/ts/MainScene/World/DrawTrail/`
- [ ] Current: triangle-strip ribbon with energy gradient
- [ ] Target: tapered tail (width decreases toward tail), particle emission at head,
        cursor-velocity-based length (faster = longer trail)
- [ ] Junni pattern: trail points in ring buffer, each point has age, width = base * (1 - age/maxAge),
        color = mix(head, tail, age/maxAge)
- [ ] File: `src/Experience/World/DrawTrail.ts` (rewrite trailColorNode + geometry)
- [ ] Keep: TSL MeshBasicNodeMaterial, works section only (HERMES §35)

### Phase 6 — Wobble cursor
- [ ] Reference: https://github.com/skaltenegger/customcursor
- [ ] Current: codrops noisy circle (Canvas 2D)
- [ ] Target: add wobble (spring physics on cursor position, lag behind mouse)
- [ ] Add: outer circle lags behind inner dot with spring (stiffness k, damping d)
- [ ] Fix magnetic: current `isStuck` snap to center is too aggressive — use lerp toward
        element center with 0.15 factor (not instant snap)
- [ ] File: `src/Experience/Cursor.ts` (add spring physics, fix magnetic lerp)

### Phase 7 — Typography + theme polish (lower priority)
- [ ] Load Bebas Neue + Oswald + JetBrains Mono (Google Fonts or self-hosted woff2)
- [ ] Update CSS: hero title → Bebas Neue 14vw, body → Oswald, code/labels → JetBrains Mono
- [ ] Add neon-lime accent (--jlz-accent: #c4ff00 or similar)
- [ ] File: `src/assets/main.less`, `index.html` (font links), `src/assets/_theme-fixes.less`

### Phase 8 — Final verification
- [ ] `bun run type-check` — 0 errors
- [ ] `bun run lint` — 0 errors (63 pre-existing warnings OK)
- [ ] Browser test: cube wobble visible, sound panel toggles, carousel momentum works,
        DrawTrail tapered, cursor wobble smooth
- [ ] Commit + push each phase separately

## Constraints
- NO test code (per AGENTS.md)
- Use existing shadcn/ui components where possible (per project rules)
- Footer must be sticky/fixed to bottom (per UI rules)
- z-ai-web-dev-sdk backend only (not used in this phase)
- `bun run dev` runs in background, port 5173 (justlovejazz) — never `bun run build`
- All API requests use relative paths with XTransformPort (not needed here, no mini-services)
- TypeScript strict, ES6+ imports, 'use client'/'use server' where needed

## Files to Create/Modify

### New files
- `src/UI/SoundPanel.ts` — sound toggle button with EQ bars
- `docs/PLAN.md` — this file

### Modified files
- `src/Experience/World/SplashCube.ts` — wobble tune (DONE)
- `src/Experience/World/MeshTransmissionMaterial.ts` — GLSL wobble sync (DONE)
- `src/Experience/Experience.ts` — wire zoom pulse, sound panel, DrawTrail
- `src/Experience/Camera.ts` — add pulse() method for zoom
- `src/Experience/World/BakuCarousel.ts` — momentum + rubber-band + auto-advance
- `src/Experience/World/DrawTrail.ts` — junni-style tapered tail
- `src/Experience/Cursor.ts` — wobble spring + magnetic fix
- `src/UI/UIManager.ts` — init SoundPanel
- `src/assets/main.less` — sound panel CSS, font imports
- `src/assets/_theme-fixes.less` — neon-lime accent
- `index.html` — font preconnect + links
- `docs/WORKLOG.md` — update with session progress
- `docs/STATUS.md` — update current state
- `docs/ARCHITECTURE.md` — update with new components
- `docs/RULES.md` — add rules for new patterns

## Verification Checkpoints
After each phase:
1. `bun run type-check` — 0 errors
2. `bun run lint` — 0 errors
3. Commit with descriptive message
4. Continue to next phase (no stopping for questions)

Final: push all commits to main, verify on project.6la.ru.
