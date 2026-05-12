# LAZY_LOADING.md

## Problem

Single monolithic bundle: index.html loads all CSS/fonts, then 1.3 MB JS (Three.js + TSK + fonts + UI).
First paint blocked by full bundle parse and initialization.

## Goal

First meaningful paint under 500ms on 3G. Progressive scene boot + deferred assets.

## Phase 0: Instant Skeleton (~14 KB total)

### New file: `public/skeleton.html`

Served from edge/CDN. Minimal HTML that renders instant loading overlay while warming main bootstrap.

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#000;color:#fff;font-family:'Inter',sans-serif}
    #loader{position:fixed;inset:0;display:flex;flex-direction:column;
      align-items:center;justify-content:center;z-index:1000;background:#000;
      transition:opacity .5s ease}
    #loader.hidden{opacity:0;pointer-events:none}
    .bar{width:120px;height:3px;background:#222;border-radius:2px;overflow:hidden}
    .fill{width:0%;height:100%;background:#fff;transition:width .2s linear}
    .brand{margin-bottom:32px;font-size:14px;letter-spacing:.15em;text-transform:uppercase;opacity:.6}
  </style>
</head>
<body>
  <div id="loader">
    <div class="brand">justlovejazz</div>
    <div class="bar"><div class="fill"></div></div>
  </div>
  <canvas id="c"></canvas>
  <div id="app"></div>
  <script>
    const fill = document.querySelector('.fill');
    let t = 0; const iv = setInterval(() => { t += 5; fill.style.width = t + '%'; if(t>=90) clear(); }, 100);
  </script>
  <script type="module">
    import { bootstrap } from '/bootstrap.js';
    bootstrap().then(() => { document.getElementById('loader').classList.add('hidden'); });
  </script>
</body>
</html>
```

### `bootstrap.js` — Phase 1 Entry (~15 KB)

**Chunks split (Vite `manualChunks`):**
- `vendor.js` — Three.js core + webgpu renderer library (~800KB, code-shared)
- `scene.js` — World, Lighting, Environment (~200KB)
- `ui.js` — UIManager, ProjectDetail, GalleryUI (~100KB)
- `main.js` — Bootstrapper + Experience (~30KB)

```
// bootstrap.js (Phase 1: lazy load)
export async function bootstrap() {
  // 1. import Three.js async vendor
  const { renderer, scene } = await import('./vendor.js');
  
  // 2. Progress to 40% — Three.js loaded
  updateProgress(40);
  
  // 3. World + lighting
  const { world, lighting, environment } = await import('./scene.js');
  updateProgress(70);
  
  // 4. UI (lightweight)
  const { UI } = await import('./ui.js');
  updateProgress(80);
  
  // 5. Assets left first paint
  const [textures, models, fonts] = await Promise.all([
    import('./assets/textures.js'),
    import('./assets/models.js'),
    import('./assets/fonts.js'),
  ]);
  updateProgress(100);
  
  // 6. Bootstrap Experience
  return await import('./main.js').then(m => m.run());
}
```

## Architecture: Three-Tier Loading

### Tier 1: Instant (< 100ms)
- HTML skeleton + CSS: first paint
- Loading bar animation starts

### Tier 2: Core (~500ms)
- Three.js vendor + renderer init
- Camera + lights + post-processing
- First scene: dark fog + environment

### Tier 3: Scene complete (~2s)
- GalleryScene bootstrap
- Card textures: lazy-loaded per-card

### Tier 4: Deferred (on-demand)
- Fonts: loaded only when corresponding sections enter viewport

### Tier 5: Heavy assets
- High-res textures: swapped in as user scrolls to corresponding sections

### Vite Configuration (already partial;
```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['three'],
        ui: ['./src/UI/UIManager', './src/UI/ProjectDetail'],
      },
    },
  },
}
```

## Implementation Order

1. [`Phase 0`](## Phase 0:): skeleton.html + bootstraping.js (working demo)
2. [`Phase 1`](## Phase 1:): Chunk splitting (Vite config, manualChunks)
3. [`Phase 2`](## Phase 2:): On-demand texture loading
4. [`Phase 3`](## Phase 3:): Deferred fonts + models
5. [`Phase 4`](## Phase 4:): CDN cache strategy (http caching, index for heavy assets)

## Performance Budget

| Metric | Target |
|--------|--------|
| First paint | < 500ms |
| Scene bootstrap | < 1.5s |
| Total load (warm cache) | < 3s |
| Skeleton+bundle size| < 25 KB
| Total bundle (code-split) | < 1.5 MB

## Key Design Decisions

- **No SSR/SSG**: WebGL renderer, canvas-only experience. skeleton is purely for UX.
- **No service worker (yet)**: Pure installable chunk. Can add SERVICE_WORKER later.
- **Asset caching**: HTTP cache (CDN) → Service Worker (PWA) → IndexedDB (precision)
