# HERMES_RULES — Hard rules. Each has a bug provenance. Follow or break the project.

## Sync

```bash
git fetch origin && git checkout main && git pull origin main
```

## Rules

1. No raw ShaderMaterial in scene — TSL NodeMaterial only
2. TSL NodeMaterial IS allowed (native WebGPU path)
3. ONE shared NodeMaterial per multi-face object (not 6 — uniform group limit)
4. Built-in materials for particles/ground/cards (reduce uniform groups)
5. Non-destructive opacity — cache baseOpacity in userData
6. `setAnimationLoop` — not rAF
7. `scene.background` — NOT set. ShaderBackground plane is the sole background (PR #130).
   Do NOT set `scene.background` to a Color or Texture — it would conflict with ShaderBackground.
   EnvSphere.attachToScene() is NOT called (disabled).
8. `alpha: false` for WebGPURenderer
9. Never remove SplashCube (baku) — central 3D object
10. section-bg transparent
11. Single font: Inter
12. NoiseText via `jlz:section-change` (not IntersectionObserver — sections are absolute)
13. `jlz:webgl-ready` must fire
14. Section IDs: intro/about/flexible/challenge/innovative/contact
15. Reuse `#project-overlay`
16. BakuCarousel card click is SOLE overlay opener
17. master-quantum-flares DO NOT TOUCH
18. No lessons system
19. `references/` READ-ONLY
20. No hallucinated architecture
21. Always verify: `bun run lint && bun run type-check && bun run build`
22. No `import.meta.hot` — breaks module loading through proxy
23. CSS imports use `?inline` suffix — prevents `@vite/client` injection
24. `server.hmr: false` + `block-vite-client` plugin — prevents reload loop
25. `try/catch` in `update()` — log + skip frame, don't stop loop
26. `info.render.drawCalls` (per-frame) not `info.render.calls` (cumulative)
27. No Subtitles re-add (disabled, will be 3D later)
28. No Input scroll re-add (mouse-only)
29. No `setProjectTextures`/`clearProjectTextures` re-add (deleted, BakuCarousel owns works)
30. No `needsUpdate=true` for opacity-only changes (uniforms, not shader structure)
31. No per-frame `scene.traverse()` — use cached NodeMaterial list
32. `dispose()` must clean ALL listeners + timers + GPU resources
33. No per-frame allocations — use pre-allocated scratch vectors
34. On-demand rendering: don't set `_needsRender=true` permanently. Event-driven only.
    Ambient breathing (1-frame refresh every ~2.5s in idle) is the ONLY exception —
    it's in Experience._updateInner, respects prefers-reduced-motion.
35. DrawTrail: works section (idx=3) ONLY. Don't re-add to about/flexible.
36. CursorLight: DELETED. Don't re-add. (Was continuous spring-follow light.)
37. **Visual tier doctrine**: `DeviceCapability.isRealWebGPU` gates premium path.
    Premium (real WebGPU): MeshPhysicalNodeMaterial + transmission=1 + 4 TSL worldDNA nodes.
    Parity (WebGL2/fallback): MeshPhysicalMaterial + opacity-glass, no TSL nodes.
    Any divergence must be documented in ARCHITECTURE.md and logged to console.
38. **Background**: `ShaderBackground` is the sole background. Do NOT re-enable
    EnvSphere.attachToScene() or set scene.background. ShaderBackground is a
    TSL MeshBasicNodeMaterial plane at z=-30, renderOrder=-1000.
39. **worldDNA TSL nodes**: `attachWorldDNA()` connects 4 nodes on premium path only.
    On parity path it's a no-op. Don't add TSL nodes to parity path materials —
    WebGLNodesHandler may not compile them correctly.
40. **21st.dev MCP**: API key format `21st_sk_...` (not `an_sk_...` — rejected).
    Endpoint `https://21st.dev/api/mcp`. Free tier: 2 retrievals/day.
    Always port to TSL (HERMES §1) — no raw ShaderMaterial from 21st components.

## Stop conditions

- TSL/WebGPU API unclear → ask human
- Same verify fails after 2 approaches → ask human
- Design decision not in docs → ask human
- New dependency needed → ask human
