# WORKLOG — Chronological decision journal (NEWEST FIRST)

> Read the TOP entry first — it's the latest context. Each entry captures
> WHAT was done, WHY (decisions), and WHAT'S NEXT. This is different from
> git log (commit messages) and CHANGELOG.md (release notes) — it's the
> "why" journal that survives context window resets.
>
> Format: `## YYYY-MM-DD — Session goal` → Done / Decisions / Files / Next

---

## 2026-07-13 — JunniParticles (TSL GPU-animated) + auto-reduce

### Done
- Analyzed next.junni.co.jp reference (Section6 Particle) — raw GLSL ShaderMaterial
  on THREE.Points with drift + sin wave + mod wrap + circle mask + AdditiveBlending.
- Created `src/Experience/World/JunniParticles.ts` — TSL port to our stack:
  - InstancedMesh + PlaneGeometry (billboarded via TSL `billboarding` node) instead
    of THREE.Points — WebGPU only supports point primitives with pixel size 1, so
    pure Points can't have resizable sprites. InstancedMesh + billboarding works on
    both WebGPU + WebGL2 (RULES §14 parity).
  - GPU-side movement: `t*4 + sin(t + offset.y*10)*0.3` drift + `mod(pos, range)`
    wrap-around. Mirrors Section6 particle.vs. No CPU per-frame cost — only uTime
    uniform advances.
  - Circle mask: `smoothstep(0.5, 0.35, distance(uv*2-1))` — soft round particles.
  - Additive blending — luminous accumulation.
  - `setVisibility(v)` — smooth fade via uVisibility uniform.
  - `setCount(n)` — rebuilds geometry for auto-reduce.
- Replaced `makeParticles()` (static PointsMaterial) in intro/scene.ts (300
  particles) + works/scene.ts (200 particles, blue 0x4488ff). Deleted the now-unused
  `src/sections/_shared/makeParticles.ts`.
- Wired `particles.update(dt)` into World.update() scene-group loop (same pattern as
  typo/orb/timeline/carousel).
- Auto-reduce: Experience.update() now halves all JunniParticles counts when `_lowFps`
  (FPS < 30 for 60 frames) flips true. One-way (`_particleReductionApplied` flag) —
  never auto-restore (GPU spike would re-trigger). Foundation (`_lowFps`) was already
  in place from Sprint 11; this wires the actual adaptive reduction.

### Key decisions (WHY)
- **InstancedMesh over THREE.Points**: WebGPU limitation — point primitives are
  pixel-size-1 only. The reference uses THREE.Points + raw GLSL (WebGL-only). For
  parity we use instanced billboards — works on both backends, same visual.
- **TSL NodeMaterial (RULES §1/§2)**: reference uses raw ShaderMaterial. We port to
  TSL — `Fn()` closures + `attribute('offsetPos')` + `billboarding({position})` +
  `smoothstep`/`mod`/`sin` TSL nodes. Same shader logic, portable to WebGPU.
- **GPU-side movement over CPU**: ParticleBurst (existing) does CPU-side matrix
  updates per frame (200 matrices). For continuous ambient particles (300+), GPU-side
  is cheaper — only one uniform update per frame, the shader does all position math.
- **One-way auto-reduce**: restoring count causes a geometry rebuild + GPU upload
  spike → FPS drops again → loop. Better to stay reduced. User can reload page to
  reset. DevPanel shows 'low fps ⚠' so it's visible.

### Files touched
- `src/Experience/World/JunniParticles.ts` (NEW — 220 LOC)
- `src/sections/intro/scene.ts` (makeParticles → JunniParticles)
- `src/sections/works/scene.ts` (makeParticles → JunniParticles)
- `src/sections/_shared/makeParticles.ts` (DELETED — unused)
- `src/core/World.ts` (particles.update() in scene-group loop)
- `src/Experience/Experience.ts` (_particleReductionApplied + auto-reduce block)

### Verification
- type-check: 0 errors
- lint: 0 errors (61 pre-existing warnings)
- build: green
- test:unit: 69 passed
- Agent Browser: 6 scene groups, intro=300 particles, works=200, isReduced=false,
  0 console errors. (WebGL2 fallback — WebGPU premium path needs vision QA via
  Hermes on project.6la.ru.)

### Next
- Vision QA via Hermes: verify particles render + animate on real WebGPU
- Optional: visibility animation on section enter/leave (fade in/out)
- Optional: boost effect (Section6 particleTimeScale 10x on trigger)

---

## 2026-07-12 — Cursor audit: 5 memory/lifecycle fixes

### Done
- P1 (real leak): WorkCards listeners survived SPA navigation. router.ts did
  `el.innerHTML = renderPage(page)` — old DOM nodes died, but `cards[]` array
  in WorkCards.ts kept references + pointermove/click listeners on detached
  nodes → GC-blocked. Each /works visit added 8 more cards. Fix: call
  `disposeWorkCards()` in router.renderView() BEFORE innerHTML replacement.
- P2: console.info in Renderer.ts:149 (render path log) without
  `import.meta.env.DEV` gate → production console noise. Wrapped in DEV check.
- P2: empty `bus.on('intro:done')` handler in Experience.ts:218 — dead listener
  (body was empty; theme is global, splash owned by main-app.ts). Removed the
  handler; kept `bus.emit('intro:done')` as a public extension point. Left a
  comment explaining why no splash logic belongs here.
- P3: `scene.environment` PMREM texture not disposed in destroy() — leak on
  HMR teardown. Added `scene.environment.dispose()` + null the reference.
- P3: startAudio click/keydown listeners not removed in destroy() — leaked
  if destroy() ran before any user gesture (HMR). Saved handler to
  `_startAudioHandler` field; destroy() removes it if still attached.
- P3: World.disposeSceneGroups() double-dispose on BakuCarousel children —
  gallery.dispose() ran first, then traverse() called disposeMaterialDeep on
  the same materials. Three.js Material.dispose() is idempotent so it worked,
  but fragile. Now collects gallery + descendants into a Set and skips them
  in the traverse.

### Key decisions (WHY)
- **disposeWorkCards in router, not in entry-app**: router.renderView() is the
  single point where DOM replacement happens. Calling dispose there (before
  innerHTML) guarantees cleanup regardless of which page is being left. The
  jlz:route-change handler in entry-app.ts (which calls initWorkCards) runs
  AFTER the new DOM is in place — wrong place for dispose.
- **Kept bus.emit('intro:done') despite removing the listener**: the event is
  a public API contract (fire-once after intro animation). Removing the emit
  would be a breaking change for any future subscriber. The emit is cheap
  (no subscribers = no-op). The empty listener was the dead code, not the emit.
- **Gallery descendants Set in World**: the alternative (checking `obj.parent`
  chain) is O(depth) per node and fragile against nesting changes. A Set built
  once via gallery.traverse is O(1) lookup and self-maintaining.

### Files touched
- src/router.ts (P1 — disposeWorkCards import + call)
- src/Experience/Renderer.ts (P2 — DEV gate on console.info)
- src/Experience/Experience.ts (P2 intro:done removal + P3 startAudio field +
  P3 scene.environment dispose)
- src/core/World.ts (P3 — gallery descendants skip in disposeSceneGroups)

### Verification
- lint: 0 errors (61 pre-existing warnings)
- type-check: 0 errors
- build: green
- test:unit: 9/9 passed

### Next
- Cursor audit also flagged: 61 ESLint warnings (no-console in dev-only paths,
  no-explicit-any on WebGPU/Three.js API). Not bugs — tracked for future
  type-safety pass on the WebGPU layer.
- vendor-three 1.2MB (gzip 334KB) — already lazy-loaded, further code-splitting
  is a separate perf task.

---

## 2026-07-11c — Blog polish + meta optimization + SfxSystem + DevPanel/FPS

### Done
- Sprint 8: Blog post polish (NEXT.md medium). Prism.js 1.30 code highlighting
  (vendored core + clike + javascript + typescript + glsl + css into
  public/vendor/prism/, ~16KB total, no CDN). prism-tomorrow theme aligned with
  JLZ card surface via blog.less overrides. Reading progress bar
  (.jlz-reading-progress, top-fixed, scaleX = scroll %, rAF-throttled).
  public/js/blog.js — shared script (year + reading progress + Prism.highlightAll).
  All 4 articles + blog.html updated. Lazy images: N/A (zero <img> in blog).
- Sprint 9: Meta optimization. New favicon (public/logo.svg → favicon.svg —
  yellow #fff72c + white on #232534 'l@6' mark, replaced old purple-gradient).
  PWA manifest (public/site.webmanifest — name, icons, shortcuts, theme_color).
  apple-touch-icon + mask-icon added to all 6 HTML entries. preview.jpg
  (1200×630, already present) now used for ALL og:image + twitter:image +
  JSON-LD image fields (was: per-page project covers — inconsistent branding).
  index.html og:url fixed (/app → /, stale splash artifact). Cache headers
  (public/_headers — Netlify/Cloudflare format: immutable for fingerprinted
  assets/fonts/vendor, no-cache for HTML, revalidate for brand files; security
  headers globally).
- Sprint 10: SfxSystem (NEXT.md low — audio). New src/core/SfxSystem.ts —
  procedural UI sounds via Web Audio API (zero samples, ~90 LOC). 4 SFX:
  hover (sine 880Hz tick), click (triangle 180Hz tap), open (sweep 220→660Hz),
  close (sweep 660→220Hz). Lazy-init AudioContext on first play() (autoplay
  policy). setMuted() master gain → 0. Integrated: Cursor.ts (hover on
  [data-magnetic]/a/button, click), ProjectOverlay.ts (showContainer=open,
  hide=close). Experience.ts jlz:sound-toggle now mutes audio + sfx together.
  Respects existing jlz:sound localStorage pref (default OFF).
- Sprint 11: DevPanel + FPS (NEXT.md low). DevPanel: added 'lang' (EN/RU) +
  'low fps ⚠' indicators to Stats folder; new 'Scene' folder with ground-plane
  toggle + reset button (debugging RULES §20). Experience: rolling 60-frame
  FPS tracker, public lowFps getter, _lowFps flips true when avg FPS < 30
  sustained over 60 frames. Auto-reduce particle count intentionally NOT wired
  (requires BufferGeometry rebuild — documented as future work).

### Key decisions (WHY)
- **Prism vendored, not CDN**: blog articles are standalone HTML (not part of
  the SPA bundle). Vendoring keeps them self-contained, offline-capable, and
  avoids a runtime CDN dependency. ~16KB total is negligible.
- **Procedural SFX, no samples**: SfxSystem synthesizes all sounds at runtime
  (oscillator + gain envelope). Zero network payload, zero asset loading, ~90
  LOC. Trade-off: less rich than sampled audio, but perfect for short UI ticks
  and whooshes. If richer audio is later needed, swap SfxSystem internals
  without touching the play() API.
- **SFX respects jlz:sound pref**: no new UI. The existing splash config sound
  toggle covers ambient + SFX together. Adding a separate SFX toggle would
  fragment the audio UX — one toggle is cleaner.
- **Ground toggle in DevPanel overrides RULES §20 temporarily**: the toggle is
  dev-only (DevPanel is never constructed in production per Experience.init
  guard). The 'Reset ground' button restores the rule. This is a debugging
  tool, not a feature.
- **_lowFps flag, no auto-reduce yet**: the tracker is the foundation.
  Auto-reducing particle count requires BufferGeometry rebuild (particles are
  static Points clouds, count set at creation in makeParticles). Wiring that
  is an architectural change (makeParticles would need a setCount method).
  Documented as future work in NEXT.md low tier.
- **_headers format**: Netlify/Cloudflare Pages read _headers automatically.
  For Caddy/nginx, translate to Cache-Control response headers. The file is
  self-documenting — each rule has a comment explaining the strategy.

### Files touched
- public/vendor/prism/* (7 files), public/js/blog.js, src/assets/blog.less (Sprint 8)
- public/favicon.svg (replaced), public/logo.svg (kept), public/site.webmanifest,
  public/_headers, index.html, blog.html, blog/*.html (Sprint 9)
- src/core/SfxSystem.ts (new), src/Experience/Experience.ts, src/Experience/Cursor.ts,
  src/UI/ProjectOverlay.ts (Sprint 10)
- src/core/DevPanel.ts, src/Experience/Experience.ts (Sprint 11)

### Verification
- `bun run lint`: 0 errors (61 pre-existing warnings)
- `bun run type-check`: 0 errors
- `bun run build`: green (~1.8s)
- `bun run test:unit`: 9 passed
- Agent Browser (per SANDBOX.md): index.html manifest/apple-touch/favicon/og:image
  all confirmed via curl (raw HTML). Blog article: Prism loaded, 111 tokens
  highlighted, reading-progress bar present, 0 console errors.

### Next
- Audio system part 2: ambient track + audio-reactive visuals on Works (NEXT.md low)
- Auto-reduce particle count when _lowFps (requires makeParticles.setCount — future)
- Blog post design polish part 2: lazy images when <img> is added, lightbox

---

## 2026-07-11b — SANDBOX runbook + WorkCards a11y + i18n dropbar + Lighthouse

### Done
- Sprint 4: Created `docs/SANDBOX.md` — operational runbook for dev-server + Agent
  Browser verify in the GLM sandbox. Captures the 5 gotchas observed during the
  prior session's verify loops (background processes die between Bash calls;
  localhost unreachable from browser; `allowedHosts` blocks JS via LAN IP;
  headless WebGL2 throttles `jlz:webgl-ready`; screenshots time out on 3D canvas).
  AGENTS.md now links it in the docs table + after the Verification section.
- Sprint 5: WorkCards keyboard navigation (NEXT.md medium). Roving tabindex
  (WAI-ARIA pattern): one card per `.jlz-works-grid` is `tabindex=0` (Tab entry),
  rest `tabindex=-1`. ArrowLeft/Right move focus within the active section's
  2-card row + re-anchor roving. ArrowUp/Down left alone (joystick owns vertical
  section nav). Enter/Space open via native `<button>`. `jlz:page-section-change`
  resets roving in all grids. Single document-level keydown listener, tracked
  for cleanup in `disposeWorkCards()`. CSS `:focus-visible` already existed.
- Sprint 6: i18n dropbar (NEXT.md medium). 58 EN + 58 RU `dropbar.*` keys added
  to `src/core/i18n.ts` (`dropbar.<page>.s<idx>.title/subtitle` +
  `dropbar.<page>.featured.title/subtitle`). `UIMenu.ts` `DropSection` + `featured`
  interfaces gained `titleKey`/`subtitleKey`; `NAV_ITEMS` data carries the keys;
  `renderNavItems()` emits `data-i18n` on `.jlz-dropbar__title` + featured title
  spans. Works page section titles are project names (proper nouns, RULES §32) →
  `titleKey` intentionally undefined there (English stays).
- Sprint 7: Lighthouse re-run (NEXT.md high) — closed with caveat. Last
  successful report (pre-Sprint 1-6): Performance 100, Accessibility 95, Best
  Practices 96, SEO 100. A fresh post-Sprint-1-6 run could NOT be obtained in
  this sandbox — LHCI over `staticDistDir` fails with `NO_FCP` (headless Chrome
  never paints without a real display; `--headless=new --no-sandbox` didn't
  help). Sprint 1-6 changes don't touch the FCP path (3D canvas is lazy-loaded
  after FCP; changes are docs, dead-config removal, a11y keyboard nav, i18n
  strings). Recommend re-running on a real-Chrome machine or in GitHub Actions.
- Cleanup: `.lighthouseci/` added to `.gitignore` (was missing — LHCI reports
  were being committed as source). Removed from tracking.

### Key decisions (WHY)
- **SANDBOX.md separate from RULES.md**: RULES is bug-provenance for code;
  sandbox is environment operational knowledge. Different audience, different
  update cadence. Keeping them separate prevents RULES from bloating with
  non-code rules.
- **Roving tabindex over a simple keydown-only approach**: the WAI-ARIA
  pattern is the accessible standard (Tab enters the grid at one anchor,
  arrows move within). A naive "all cards tabindex=0" would pollute the Tab
  order (8 cards across 4 sections = Tab hell). Roving keeps Tab order clean
  (one entry per section) while still allowing arrow navigation.
- **ArrowUp/Down NOT handled in WorkCards**: the joystick owns vertical
  section navigation (1→2→3→4). Intercepting arrows here would break that.
  The keydown handler explicitly checks focus context before acting, so it
  never steals arrows from the joystick, inputs, or overlays.
- **Works page titles stay English in dropbar**: RULES §32 (project names are
  proper nouns). `titleKey` is `undefined` for those — `renderNavItems` emits
  no `data-i18n`, so `applyTranslations()` leaves the English text. Subtitles
  still translate (they're descriptive, not proper nouns).
- **subtitleKey fields kept even though subtitles aren't rendered**: the
  dropbar template currently shows only num + title (subtitle is in the data
  but not in the DOM). The keys are future-proofing — when subtitles get
  rendered, they'll translate with zero i18n.ts changes.

### Files touched
- `docs/SANDBOX.md` (NEW), `AGENTS.md` (Sprint 4)
- `src/UI/WorkCards.ts` (Sprint 5 — roving tabindex + keydown)
- `src/core/i18n.ts`, `src/UI/UIMenu.ts` (Sprint 6 — dropbar i18n)
- `NEXT.md` (Sprint 7 — closed Lighthouse + i18n dropbar + WorkCards items)
- `.gitignore`, `.lighthouseci/*` removed from tracking (cleanup)

### Verification
- `bun run lint`: 0 errors (61 pre-existing warnings)
- `bun run type-check`: 0 errors
- `bun run build`: green (~1.8s)
- `bun run test:unit`: 9 passed
- Agent Browser (per SANDBOX.md procedure): works page loaded, 0 console errors.
  - Dropbar: 20 title spans + 6 featured spans carry `data-i18n` (sample
    `dropbar.home.s1.title`, `dropbar.home.featured.title`).
  - WorkCards: 4 grids, 2 cards each, roving tabindex `["0","-1"]` confirmed
    on first grid.

### Next
- Blog post design polish (code highlighting, lazy images, reading progress) — NEXT.md medium
- Audio system, DevPanel improvements, render-budget FPS tracking — NEXT.md low

---

## 2026-07-11 — Dead-code cleanup + stale doc sync (fresh-eyes audit follow-up)

### Done
- Sprint 1: Fixed stale WireframeTypography labels (artifacts of `9d8e0c7` Services/Works
  swap + `7e2f480` 8→6 section unification — strings were never updated).
  - `about/scene.ts`: `'SERVICES'` → `'ABOUT'` (matches the About cube face)
  - `contact/scene.ts`: `'MANIFESTO'` → `'HELLO'` (restores the file-header intent: "3D greeting")
- Sprint 2: Removed dead per-page `sceneObjects` config from WorldConfig (`-47 LOC`).
  - `sceneForContentPage()` assigned 3D objects to **wrong cube-face indices** (e.g.
    `wireframeText: idx === 1` for services, but WireframeTypography only exists on
    idx 2/4; `bakuCarousel: idx === 1` for works, but carousel is on idx 3). Every
    assignment was a no-op via the `if (typo)` / `if (orb)` guards in World.ts.
  - `sceneEnvSpherePattern` field removed — dead (World.ts:352 "REMOVED", EnvSphere
    follows global theme only, patterns are fixed per section).
  - `particles` flag removed from `SceneControl.objects` — never read in World.ts.
  - Kept (alive): `scene.transition` (easing, consumed by `_applyEasing`), `scene.objects.bakuCarousel`
    (home-only guard in World.ts:419), home RAW sceneObjects (correct indices, objects exist there).
- Sprint 3: Doc sync (stale metrics + dead-field cleanup).
  - `STATUS.md` / `AGENTS.md`: 17 tests → 9 (EventBus 5, not 13 — suite was trimmed,
    docs never updated); `~14.4K LOC` → `~11.6K TS LOC` (TS-only count).
  - `RULES.md §18`: was a verbatim duplicate of §16 → replaced with a placeholder note
    so §19+ numbering stays stable (RULES refs §15-17, §20, §50 must not shift).
  - `ARCHITECTURE.md` SceneControl: removed `particles` + `envSpherePattern` from the
    type sketch; clarified `scene.objects` is home-only (content pages skip the
    visibility block — objects show via shared scene groups).
  - `NEXT.md`: closed the "3D objects on content pages" high-priority item —
    re-evaluated: SectionSceneFactory is hardcoded, scene groups are shared, objects
    already render on all pages when their cube-face group is visible.

### Key decisions (WHY)
- **Labels match cube faces, not content pages**: scene groups are shared across all
  SPA pages (SectionSceneFactory is hardcoded), so the 3D text anchor must match the
  cube face (About → 'ABOUT', Contact → 'HELLO'), not any content page that happens
  to reuse that face.
- **Removed `sceneForContentPage` rather than "fixing" indices**: the architecture
  explicitly shares scene groups across pages, so per-page `sceneObjects` contradicts
  it. True per-page visual variety would need per-page scene factories — an
  architectural change, not a config tweak. The dead config was misleading (looked
  like a working feature, actually did nothing).
- **Kept §18 as a placeholder** instead of renumbering: RULES references (§15-17, §20,
  §50) in AGENTS.md / ARCHITECTURE.md would silently break if numbers shifted.
- **Did NOT touch Enter-button init flow**: browser verify showed `enterReady=false`
  in headless after 22s, but this is pre-existing headless timing (`jlz:webgl-ready`
  emit uses `setTimeout` which throttles under headless WebGL2 + LAN IP). My changes
  didn't touch `main-app.ts` / `entry-app.ts` / `Experience.ts` init. STATUS.md
  confirms the Enter contract works in real browsers (Lighthouse Perf 100).

### Files touched
- `src/sections/about/scene.ts`, `src/sections/contact/scene.ts` (Sprint 1)
- `src/core/WorldConfig.ts` (Sprint 2)
- `docs/STATUS.md`, `docs/RULES.md`, `docs/ARCHITECTURE.md`, `AGENTS.md`, `NEXT.md` (Sprint 3)

### Verification
- `bun run lint`: 0 errors (61 pre-existing `no-empty-object-type` warnings, tracked per RULES §48)
- `bun run type-check`: 0 errors (strict + noUncheckedIndexedAccess)
- `bun run build`: green (~1.8s)
- `bun run test:unit`: 9 passed (EventBus 5 + Noise 2 + motionPolicy 2)
- Agent Browser (headless WebGL2, LAN IP): 6 scene groups created, all userData correct
  (`orb0`/`typo2`/`gallery3`/`typo4`/`timeline5` all `true`), 0 console errors,
  `Experience.init` complete (DevPanel ready log), `window.experience` defined.

### Next
- Lighthouse re-run (NEXT.md high priority — after all 2026-07-12 + 2026-07-11 changes)
- i18n dropbar titles, blog post polish, WorkCards keyboard nav (NEXT.md medium)

---

## 2026-07-12 — Works page 3D cards + i18n + meta tags + Enter/ground fixes + docs rewrite

### Done
- Works page redesigned: 4 sections × 2 large 3D tilt cards = 8 case studies
  (2 new projects added: Indigo Drift, Crimson Hours, cover images generated)
- i18n full implementation: 130+ EN/RU keys, `data-i18n` on all templates (57 attrs)
- Route-based meta tags: `pageMeta.ts`, per-page title/description/OG, i18n-aware
- Enter button fix: always visible but DISABLED until `jlz:webgl-ready`
  (was activating at 4s/5s fallback — too early under throttling)
- Ground plane fix: visible ONLY on section 4 (was `!showGallery` = everywhere except Works)
- `jlz:webgl-failed` event added (init crash → load error, not Enter)
- `jlz:open-project` event added (WorkCards click → reuses ProjectOverlay)
- All 6 docs rewritten for accuracy (AGENTS, RULES, ARCHITECTURE, STATUS, UIKIT3, CHANGELOG)

### Key decisions (WHY)
- **Enter disabled, not hidden**: user wants to see the button but can't click until ready.
  CSS `pointer-events:none` + `opacity:0.5` until `.is-ready` class. 60s fallback = load error.
- **Ground only section 4**: section 4 = bottom cube face (-Y) = "grounded" feel.
  All other sections float in void. `groundOpacity` 0.05 → 0.25 for visibility.
- **WorkCards reuses ProjectOverlay**: same fullscreen overlay as home BakuCarousel.
  Click dispatches `jlz:open-project { idx }` → Experience opens overlay. No duplicate UI.
- **i18n flat dot notation**: `home.studio.title`, `services.creativeDirection.lead`.
  English always default content (no-JS fallback). Project names stay English (proper nouns).
- **Meta tags from i18n dictionary**: `meta.<page>.title` / `.description`.
  Switch language → meta switches. `<html lang>` reflects current language.

### Files touched
- `src/pages/content/works.ts` — new 4-section 3D-cards template
- `src/UI/WorkCards.ts` — NEW: 3D tilt + click handler (idempotent initWorkCards)
- `src/core/i18n.ts` — expanded to 130+ keys
- `src/core/pageMeta.ts` — NEW: route-based meta tags
- `src/core/EventBus.ts` — added `jlz:webgl-failed`, `jlz:open-project`
- `src/Experience/Experience.ts` — `jlz:open-project` handler, ground fix
- `src/entry-app.ts` — Enter disabled logic, 60s fallback
- `src/main-app.ts` — emits `jlz:webgl-failed` on crash
- `index.html` — Enter button CSS (disabled state), 60s fallback
- `src/Data/Projects.ts` — 2 new projects (indigo-drift, crimson-hours)
- All section templates + content pages — `data-i18n` attributes
- All 6 docs — rewritten

### Next
- See `NEXT.md` for prioritized backlog

---

## 2026-07-11 — Blog redesign + mobile QA + SEO sitemap + i18n structure

### Done
- Blog standalone pages: blog.less, 4 articles, JSON-LD BlogPosting, OG/Twitter meta
- Mobile QA passed: blog + blog posts responsive at 390px
- SEO sitemap: 6 SPA pages + robots.txt + structured data
- i18n EN/RU structure: i18n.ts created, lang toggle wired to splash config button
- Ponytail audit: -632 LOC, -9 files dead code removed
- Perf audit: CubeCamera throttle (6 frames), bloom skip (intensity=0), leak fixes
- NoiseText/BlurFade on all pages (not just home)
- BakuCarousel only on home Works section (not all pages)
- Dead code cleanup + memory leak fixes

### Key decisions
- **Footer removed entirely**: joystick is sole bottom UI (minimalism)
- **Splash merged into index.html**: no separate splash page, no navigation flash
- **QF color-mode overrides**: `_theme-fixes.less` handles dark mode for all components
- **Routes without /app prefix**: index.html is canonical entry
- **worldDNA.ts deleted**: TSL node system was dead code
- **Easings.ts deleted**: only inline `easeInOutQuart` needed

### Files touched
- `src/assets/blog.less` — NEW
- `blog/*.html` — 4 articles
- `public/sitemap.xml`, `public/robots.txt` — SEO
- `src/core/i18n.ts` — initial structure (40 keys)
- Multiple files — dead code removal, perf optimizations

### Next
- Apply `data-i18n` attributes to templates (done 2026-07-12)
- Blog post design polish (code highlighting, images)
- Route-based meta tags (done 2026-07-12)

---

## 2026-07-10 — 8→6 section unification + uk-light theme + ponytail audit

### Done
- 8→6 sections (Flexible/Innovative removed)
- UIKit native `uk-light` (replaced 50+ LOC custom overrides)
- Mobile-first rem sizing (`html { font-size: 0.85rem }` mobile → `1rem` ≥640px)
- BakuCarousel race condition fixes
- Design tokens merged into `_import.less`
- Unified `sectionShell()` — ONE wrapper for all pages (home + content)

### Key decisions
- **sectionShell unification**: home and content pages use the same helper.
  `mode: 'home'` (data-section, 3D cube face) vs `mode: 'content'` (data-page-section).
- **uk-section-medium does NOT exist in UIKit3**: only xsmall/small/large/xlarge.
  Use `uk-section-small uk-section-large@m`.
- **Per-section inverse theme**: ContentReveal applies uk-light per-section based on
  sectionTheme in WorldConfig. auto: light→uk-light, dark→no. inverse: FLIPPED.

### Files touched
- `src/sections/_shared/constants.ts` — sectionShell, contentTop, contentBottom
- `src/sections/*/template.ts` — all 6 home sections
- `src/pages/content/*.ts` — all content pages
- `src/Experience/ContentReveal.ts` — per-section theme

### Next
- i18n full implementation (done 2026-07-12)
- Works page 3D cards (done 2026-07-12)
