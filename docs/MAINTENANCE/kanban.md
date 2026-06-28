# Kanban Board — justlovejazz

## ✅ DONE

### EPIC: AUDIT fixes (docs/AUDIT.md) — all resolved

- [x] A-001: World.resize() — implement propagation to sceneGroups + groundPlane
- [x] A-002: Portrait FOV — portraitFovBoost in PhaseConfig + Camera.updateSmooth()
- [x] A-003: Section.switchState() — fix bus.channel overwrites-current-value bug
- [x] A-004: Wire world.resize() from Experience Sizes listener
- [x] A-005: Baku role caching — _currentRole, skip applyRoleAndParams when unchanged
- [x] A-006: Double traverse — _meshCache in sceneGroups userData
- [x] A-007: DrawTrail per-section re-enable + visibility gating (about, flexible)
- [x] A-008: Section.setMeshOpacity() — reuse _cachedMeshes (lazy-init)
- [x] A-009: Baku worldState.bakuMaterial → baku.updateMaterial() connection
- [x] A-010: Lenis — migrated to `lenis` package (was @studio-freight/lenis)
- [x] A-015: Per-section cursor follow strength (cursorFollowStrength)
- [x] A-011..A-014: Resolved by design (HERMES §1, out of scope, StateBus better, CPU opacity correct)

### EPIC: Optimization Sprints 1-5 (2026-06-28, PR #79)

- [x] Sprint 1: Remove 3.2 MB dead assets; untrack .idea/.claude/test-results; delete ts5112-fix.json (LLM artifact)
- [x] Sprint 1: Deps cleanup — remove troika-three-text; tweakpane→devDeps+dynamic import; migrate @studio-freight/lenis→lenis
- [x] Sprint 1: Fix CI (npm ci→bun install; add type-check/test/lint); rewrite e2e tests; fix projects/*.html
- [x] Sprint 2: visibilitychange pauses render loop; lazy KTX2Loader; particle counts gated by DeviceCapability.tier
- [x] Sprint 3: Fix double ACES + triple sRGB; disposeMaterialDeep util; SplashCube.dispose() called; resize debounced; reduced-motion freezes decorative 3D anims
- [x] Sprint 4: Enable TS strict:true (0 errors); ESLint 9 flat config + Prettier; migrate manualChunks→rolldown codeSplitting (vendor-three isolated, −40% preload)
- [x] Sprint 5: a11y (skip-link :focus, dialog focus-trap, noscript, cursor scope); SEO (og/twitter/canonical/JSON-LD/sitemap); prerender home sections
- [x] Bug fixes: title delay (fire jlz:webgl-ready at curtain mid-open); overlay flash (remove uk-scrollspy); prev/next (round goTo, use targetIdx); letter-spacing pop (strip span styles); section snap (CSS scroll-snap + ranges /6→/5 + BG lerp 6.0 + double-smoothstep); flexible wireframe icosahedron; portals rename (triggerPortalCollapse→reveal)

### EPIC: Re-enable DrawTrail

- [x] T-001..T-004: DrawTrail integrated in World.ts + update loop (64-point ring buffer)

### EPIC: Junni reference repo cloned

- [x] Clone next.junni.co.jp → references/next.junni.co.jp/
- [x] .gitignore for .git in references

### EPIC: Critical bug fixes (2026-06-26)

- [x] T-060..T-066: PostProcessingManager keys, NarrativePhase sync, Baku memory leak, WorldAtmosphere dead code, entry-app setTimeout cleanup, docs update

### EPIC: Quality pass (2026-06-26)

- [x] T-067..T-070: BG.setProgress continuous lerp; Input.ts framerate-independent smoothing; Camera shake reset

### EPIC: Section content + perf (2026-06-26)

- [x] T-071..T-073: SectionSceneFactory unique geometry; Section.update mesh cache; CursorLight zero-alloc

### EPIC: World Environment Architecture (2026-06-26)

- [x] T-074..T-079: Lights.ts rewrite (SECTION_PRESETS); World.updateTransform lights+fog; particle cache; SectionSceneFactory hideGeometry

## TODO

### EPIC: Bespoke 3D section content (deferred — needs human/design)

- [ ] T-090: Section 0 (Intro) — white BG hero object (replaces placeholder particles)
- [ ] T-091: Section 1 (About) — dark BG blob / reflective floor
- [ ] T-092: Section 2 (Flexible) — refine wireframe + text texture interaction
- [ ] T-093: Section 4 (Innovative) — constellation/network graph
- [ ] T-094: Section 5 (Contact) — closing visual

### EPIC: Codebase hardening (follow-up from bug 8 analysis) — DONE

- [x] Mass `bun run format` Prettier cleanup (65 files)
- [x] Enable noUncheckedIndexedAccess + fix 80 errors (9 files)
- [x] Replace untyped jlz:* custom events (27 usages) → typed EventBus<T>
- [x] SectionStore consolidation — ASSESSED & DEFERRED (the 4 sources are 1 source of truth + 3 derived caches; not redundant, refactor not worth the risk)
- [ ] references/next.junni.co.jp/ (85 MB) — recommend git-lfs or remove (READ-ONLY per AGENTS §17/§18, decision deferred to human)

### EPIC: Holographic UI Panels (deferred — aspirational)

- [ ] Displays panel — interactive holographic UI
- [ ] Comrades panel — multi-character display
