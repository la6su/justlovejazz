# LAZY_LOADING — Architectural Plan

## Problem

Single monolithic bundle: index.html → all CSS/fonts → 1.3 MB JS (Three.js + TSL + UI). First paint blocked by full parse + init.

## Goal

First meaningful paint < 500ms on 3G. Progressive scene boot + deferred assets.

## Tiers

| Tier | Content | Target |
|------|---------|--------|
| 1. Instant | skeleton HTML + CSS (loading overlay) | < 100 ms |
| 2. Core | Three.js vendor + renderer + lights + post-processing | < 500 ms |
| 3. Scene | GalleryScene, card textures (lazy per card) | ~ 2 s |
| 4. Deferred | Fonts (on section enter) | on-demand |
| 5. Heavy | High-res textures (on scroll to section) | on-demand |

## Phase 0 — Skeleton (~14 KB)

File served from edge/CDN. Minimal HTML rendering instant loading overlay, then dynamically importing the main bootstrap.

```html
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
    .fill{width:0;height:100%;background:#fff;transition:width .2s linear}
    .brand{margin-bottom:32px;font-size:14px;letter-spacing:.15em;text-transform:uppercase;opacity:.6}
  </style>
</head>
<body>
  <div id="loader">
    <div class="brand">justlovejazz</div>
    <div class="bar"><div class="fill"></div></div>
  </div>
  <canvas id="c"></canvas>
  <script type="module">
    const f=document.querySelector('.fill');let t=0;const iv=setInterval(()=>{t+=5;f.style.width=t+'%';if(t>90)clearInterval(iv)},100);
    import('/bootstrap.js').then(m=>m.bootstrap()).then(()=>document.getElementById('loader').classList.add('hidden'));
  </script>
</body>
</html>
```

## Phase 1 — Chunk Splitting

Vite `manualChunks`:

```ts
manualChunks: {
  vendor: ['three'],
  ui: ['./src/UI/UIManager', './src/UI/ProjectDetail'],
}
```

Chunks:
- `vendor.js` — Three.js core + renderer adapters (~800 KB)
- `scene.js` — World, Lighting, Environment (~200 KB)
- `ui.js` — UIManager, ProjectDetail, GalleryUI (~100 KB)
- `main.js` — Bootstrapper + Experience (~30 KB)

### Bootstrap Function

```js
export async function bootstrap() {
  // 1. Three.js + renderer
  await import('./vendor.js');
  progress(40);

  // 2. World + lighting + post
  const { scene } = await import('./scene.js');
  progress(70);

  // 3. UI (lightweight)
  const { UI } = await import('./ui.js');
  progress(80);

  // 4. Assets (parallel)
  await Promise.all([
    import('./assets/textures.js'),
    import('./assets/fonts.js'),
  ]);
  progress(100);

  // 5. Boot Experience
  return await import('./main.js').then(m => m.run());
}
```

## Performance Budget

| Metric | Target |
|--------|--------|
| First paint | < 500 ms |
| Scene bootstrap | < 1.5 s |
| Total load (warm) | < 3 s |
| Skeleton size | < 25 KB |
| Total bundle (split) | < 1.5 MB |

## Design Decisions

- **No SSR/SSG** — canvas-only WebGL experience; skeleton is pure UX
- **Service Worker** — Phase N only, HTTP cache first
- **Asset caching** — HTTP → Service Worker → IndexedDB (heavy assets)

## Implementation Order

1. ~~Skeleton HTML + progress indicator~~ — `index.html` critical CSS + `src/entry.ts` deferred Less/app
2. ~~Vite manualChunks~~ — `vite.config.ts` (`vendor-three`, `vendor-ui`, `chunk-ui`, `chunk-scene`, …)
3. ~~On-demand texture loading per card~~ — `GalleryScene` + shared placeholder (`placeholderTexture.ts`)
4. Deferred fonts + models — optional / future (`@font-face` subset, asset manifest)
5. ~~CDN cache + SW~~ — `public/sw.js` + register in `main-app` (prod); CDN headers at deploy time
