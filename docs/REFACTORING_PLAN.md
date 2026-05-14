# REFACTORING_PLAN

Поэтапный план для полного контроля над сценнымими.

## ETA 1. Fix UV Warning **(day 1 now)**

**Problem:** `THREE.AttributeNode: Vertex attribute "uv" not found on geometry`

**Fix:** Add `ensureUV()` helper that computes UVs for MeshStandardMaterial geometries:

```ts
// SectionSequences.ts — already added
function ensureUV(geo: THREE.BufferGeometry): void {
  if (!geo.getAttribute('uv')) {
    const pos = geo.getAttribute('position')
    const uv = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = pos.getX(i)
      uv[i * 2 + 1] = pos.getY(i)
    }
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  }
}
```

**Action:** Apply `ensureUV()` to all geometries used with MeshStandardMaterial in SectionSequences.ts.

**Files:** `SectionSequences.ts`, `SectionContent.ts`

**Verify:** Build passes, console clean of UV warnings.

---

## ETA 2. Scene → Page Split (current)

**Current:** All 8 steps available on all pages.

**Target:** Each page gets 2 scenes only.

```
Trinity  → step01 (smoke) + step02 (ball)
Works    → step03 (beams) + step05 (neon)
Home     → step07 (drop) + step08 (galaxy)
Contact  → step04 (city) + step06 (flow)
```

**Files:**
- `src/Experience/World/SectionSequences.ts` — `getWorldCreators()` per-page records
- `src/Experience/Experience.ts` — initWorldCreators per page
- `CameraStateManager` — already works with 8 steps via scroll
- `WorldConfig.ts` — already has 8 step configs

**Implementation:**
1. Define `pageToSteps` mapping in SectionSequences
2. `getWorldCreators(pageName)` returns only the steps for that page
3. `Experience.initSectionSequences()` uses only mapped steps
4. Scroll range: each step spans 0–0.5 within page (2 steps per page)

**Verify:** Each page shows only its 2 scenes, transition clean.

---

## ETA 3. Templater (day 2)

Create `src/core/Templater.ts` — lightweight string templating:

```ts
// Simple mustache-style template engine
export class Templater {
  static render(template: string, data: Record<string, any>): string {
    let result = template
    // Handle {{var}} interpolation
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\s*${key}\s*}}`, 'g')
      result = result.replace(regex, String(value))
    }
    // Handle {{#each item in arr}}...{{/each}}
    // Handle {{#if cond}}...{{/if}}
    return result
  }
}
```

**Templates:**
- `hero` — full viewport section with title + subtitle + CTA
- `section` — generic content section with number + heading + text
- `gallery` — grid of project cards (works only)
- `nav` — navigation bar
- `footer` — footer section

**Integration:**
- `src/main-app.ts` → `renderPageContent(pageName, data)`
- Each `data-page` uses Templater for content
- Data stored in `src/Data/pages.ts`

**Verify:** Pages render from templates + data. No hardcoded HTML content.

---

## ETA 4. Scene Polish (per step)

For each of 8 steps:

1. **Composition** — objects in their proper positions, no chaos
2. **Lighting** — ambient 0x030308, focal lights where needed
3. **Animation** — idle state proper (drift, pulse, shimmer, etc.)
4. **Transition** — smooth entry/exit (crossfade, not pop)
5. **Novelty** — unique visual element per step

**Progress tracker:**
- [ ] step01 smoke — ✅ smoke planes + starfield
- [ ] step02 ball — ✅ metallic sphere + glass orbs
- [ ] step03 beams — partial (need beam animation)
- [ ] step04 city — need core shapes + field
- [ ] step05 neon — need columns + grid floor
- [ ] step06 flow — need flow field lines
- [ ] step07 drop — need drop + reflections
- [ ] step08 galaxy — need spiral + nebula

---

## ETA 5. Post-Fix & Polish

- [ ] Bloom intensity locked to step presets
- [ ] Fog transitions crossfaded
- [ ] Static UV warning eliminated
- [ ] Console warnings clean
- [ ] Mobile quality tier enforced
- [ ] `prefers-reduced-motion` respected
- [ ] Asset disposal lifecycle correct
