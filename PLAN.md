# JUSTLOVEJAZZ — Production Engineering Plan

## Teaser: Key Numbers
- 48 TS файлов, 0 TypeScript errors
- Билд: 1.15 MB JS (gzip 340 KB) — повторяет Junni референс ~1.3 MB
- Public assets: 2.2 MB (1.5 MB HDR, 2 texture JPG)
- dist: 4.1 MB — завышен из-за没有在 .gitignore
- Интерактив в production: DebugStats добавляет UI но возможно не нужен в релизе

---

## Priority 1 — Critical Bugs (блокирующие)

### 1.1 BicubicFilter undefined
- **Where:** AssetManager.ts line 50
- **Problem:** THREE.BicubicFilter undefined → build warning, asset doesn't get bicubic filtering
- **Fix:** neuron replace for bicubic assignment with conditional check or use THREE.Filter
- **Impact:** Texture quality on target tier

### 1.2 PostProcessing not initialized
- **Where:** PostProcessing.ts / Renderer.ts
- **Problem:** Renderer initializes renderer.onAttach callback as post_processor?.set() — but renderer.postProcessing is undefined and never set via Renderer constructor
- **Status:** Cinematic filter stack (Chromatic, Bloom, Grain, Vignette) не применяется
- **Impact:** Visual quality doesn't match project specification

### 1.3 Inline styles forbidden
- **Where:** index.html (many)
- **Problem:** Проходит stirement что 'User strictly forbids inline styles'
- **Violation:** ~20+ inline style attributes in HTML (position, background, color, etc.)
- **Fix:** Extract all styles to `assets/main.less`, import via CSS
- **Impact:** Violation of project's foundational convention

---

## Priority 2 — Architecture & Performance (блокирующие)

### 2.1 No vite.config
- **Problem:** Project relies on defaults — no code splitting, no bundling of vendor assets, no main CSS/LESS import
- **Fix:** Create `vite.config.ts` with:
  - Code splitting (vendor chunk for three.js, separate UI chunk)
  - Asset optimization (image configs, modern image formats)
  - Main.less processing
  - Production optimizations
- **Impact:** 1.15 MB single chunk → 300-400 MB gzipped with splitting

### 2.2 No Less files
- **Status:** Memory says "all presentation must be in less files" but 0 .less files exist
- **Problem:** Styles are inlined; project难民 convention for styling
- **Action:** Create `assets/main.less` with professional style system

### 2.3 SSR Output asset size
- **Problem:** Single 1.15 MB JS bundle is acceptable for the genre (Junni comparison: ~1.3 MB), but code splitting improves perceived load time
- **Action:** Implement vendor splitting (three.js → separate chunk, UIkit → separate chunk)

### 2.4 Noise.ts placeholder implementation
- **Problem:** `noise4d()` uses `Math.random()` — actual noise is not deterministic (different each frame)
- **Impact:** Places where 4D noise is used produce inconsistent results
- **action:** Replace with actual Simplex 4D noise implementation

### 2.5 DebugStats in production
- **Problem:** DebugStats is imported and possibly attached in production builds
- **Action:** Guard with environment check (`import.meta.env.DEV`)

### 2.6 HDR asset optimization
- **Problem:** studio.hdr is 1.5 MB uncompressed — consider converting to .exr or providing KTX2 cube maps
- **Impact:** Initial load time on slow connections

---

## Priority 3 — Quality of Life & Polish (high-end studio feel)

### 3.1 Gallery not mobile-responsive
- **Problem:** Gallery transitions from 3D carousel to 1-column list on mobile but verification needed
- **Spec:** Project UX specifies "Complex 3D-synced galleries to vertical 1-column lists on mobile"

### 3.2 Missing Fonts strategy
- **Problem:** No self-hosted fonts — project loads system fonts or relies on browser defaults
- **Junni Reference:** Uses Google Fonts with preconnect and font-display: swap
- **Action:** Add premium fonts (Space Grotesk/Clash Display) with preconnect, vary-opacity, font-smoothing

### 3.3 Hero/Loading screen polish
- **Problem:** Loading screen uses UIkit spinner and basic text — doesn't match "technical, high-end feel"
- **Action:** Implement custom loading screen with:
  - Progress bar (percentage-based)
  - Slogot animation
  - Seamless transition to 3D scene

### 3.4 World sections 0-1 → 4 sections docking
- **Problem:** Current implementation maps scrollProgress 0-1 to 4 sections (Home, About, Works, Contact)
- **Verify:** Currently uses computationally gross transition range mapping (Home: 0-0.25, About: 0.25-0.5, etc.)
- **Junni uses more sophisticated section management with state machine transitions and overlapping ranges

### 3.5 Camera state management
- **Problem:** CameraStateManager wastes compute on large-scale calculations when target is already reached
- **Imp:** Each tick checks ALL 400+ possible transitions between section states when only 1 transition is relevant
- **Fix:** Transition to a state machine approach: currentSection → determine based on scrollProgress → transition only to that range

### 3.6 Simplified 3D Scene
- **Problem:** WorldAtmosphere uses basic particle system + grid; GalleryScene uses basic planes
- **Junni Reference:** Uses zk-procedural terrain/preprocessing techniques
- **Action:** When budget allows, upgrade grid to procedural TSL grid

### 3.7 UIkit modal vs TSL transition
- **Problem:** ProjectDetail uses UIkit modal for project details — second-class transition
- **Spec:** "User expects seamless, integrated WebGL transitions"
- **Action:** Replace with TSL-driven grid-to-fullscreen transition (Masked Reveal animation)

### 3.8 No error boundary/guard on production
- **Problem:** WebGL/WebGPU errors cause silent failures
- **Action:** Add error handling for GPU context loss, three.js errors, asset loading failures

### 3.9 Missing favicon.svg
- **Problem:** index.html references `/favicon.svg` but file may not exist
- **Status:** Verify and create if missing

---

## Priority 4 — Assets & Data

### 4.1 Texture placeholder files
- **Problem:** 4 projects use same texture (`proj1.jpg`) for all projects
- **action:** Create placeholder textures for all 4 projects

### 4.2 No nav icons
- **Problem:** UIManager references `src/assets/master-quantum-flares/icons/slidenav-*.svg`
- **Status:** Assets likely missing (no `master-quantum-flares` directory)
- **Action:** Create SVG icons for prev/next navigation

### 4.3 Project detail modal skeleton
- **Problem:** ProjectDetail modal warms up with show/hide immediately `project-modal` element
- **Status:** Modal element is not in index.html — UIkit error "UIkit modal element not found"

---

## Priority 5 — Monorepo & Scripting

### 5.1 Move js bundles from node_modules/dist/ to .gitignore
- **Status:** dist/ not in .gitignore
- **Action:** Add to .gitignore

### 5.2 Test infrastructure
- **Problem:** No unit tests for core TypeScript files
- **Scope:** CameraStateManager, WorldConfig, Noise, Easings

---

## Execution Order
1. BicubicFilter fix (Priority 1.1) — 1 line fix
2. Inline styles out extraction (Priority 1.3) — medium effort
3. vite.config.ts + Code splitting (Priority 2.1+2.3) — foundational
4. Less CSS system creation (Priority 2.2) — styling foundation
5. Post-processing initialization (Priority 1.2) — visual quality
6. Mobile gallery optimization (Priority 3.1) — user experience
7. Noise.ts fixed implementation (Priority 2.4) — deterministic output
8. Fonts strategy (Priority 3.2) — visual quality
9. DebugStats environment guard (Priority 2.5) — production safety
10. Loading screen polish (Priority 3.3) — first impression

---

## Project State Summary
- **TypeScript:** Clean — 0 errors, 48 files
- **Build:** Working — 560ms — 1.15 MB JS
- **Assets:** Minimal — HDR (1.5 MB), textures (2 JPG)
- **Convention Enforcement:** Inline style violation, no less files, missing architecture files
