import { defineConfig } from 'vite'
import { resolve } from 'node:path'

import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import { homePage } from './src/templates'

export default defineConfig({
  base: '/',
  publicDir: 'public',
  build: {
    target: 'es2023',
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        // ───────────────────────────────────────────────────────────────────
        // Vite 8 ships rolldown (not rollup). Rolldown's *deprecated*
        // `output.manualChunks(id)` function is internally transformed into
        // a single `codeSplitting.groups` entry whose `name(id)` callback
        // returns a chunk name per module. In rolldown 1.0.x that transform
        // does NOT reliably isolate `node_modules/three` — the manualChunks
        // function IS invoked for every three.js module and DOES return
        // `'vendor-three'` (verified by probing), but rolldown still ends
        // up re-merging the statically-imported three.js code into the
        // consuming app chunks (`chunk-core` 624 KB, `chunk-assets` 565 KB).
        //
        // The supported, non-deprecated API is `output.codeSplitting.groups`
        // with explicit `test` regexps + `priority`. Groups with higher
        // priority are matched first; matched modules are removed from
        // lower-priority groups, so vendor chunks cleanly win over the app
        // fallback. See `node_modules/rolldown/dist/shared/define-config-*.d.mts`
        // (`CodeSplittingGroup`, `CodeSplittingOptions`) for the full
        // option reference.
        //
        // KTX2 LAZY CHUNK HANDLING
        // `three/addons/loaders/KTX2Loader.js` is dynamically imported by
        // `AssetManager.getKtx2Loader()` (src/core/AssetManager.ts:32). It
        // must NOT be merged into the static `vendor-three` chunk —
        // otherwise its ~57 KB basis-transcoder glue gets modulepreloaded
        // together with the rest of three.js (regression observed in the
        // first iteration of this migration: a single 1246 KB `vendor-three`
        // chunk that combined static three.js + KTX2 and was preloaded).
        //
        // We exclude KTX2Loader from the `vendor-three` and `vendor-misc`
        // `test` functions. Because no group captures it, rolldown falls
        // back to *automatic chunking* — and since KTX2Loader is a
        // dynamic-import target, rolldown emits it as its own chunk that is
        // only fetched at runtime via `import()`. That chunk is therefore
        // NOT emitted as `<link rel="modulepreload">` in dist/index.html.
        // ───────────────────────────────────────────────────────────────────
        codeSplitting: {
          // `includeDependenciesRecursively` defaults to true — captured
          // modules' transitive deps are pulled into the same group, which
          // keeps three.js's internal addons (ktx-parse, zstddec,
          // WorkerPool, …) inside vendor-three instead of leaking into app
          // chunks.
          groups: [
            // ── Vendor chunks (highest priority — matched first) ──────────
            {
              name: 'vendor-three',
              // Match every three / three-stdlib module EXCEPT the
              // dynamically-imported KTX2Loader — that one must stay in its
              // own lazy chunk (see header comment).
              test(id) {
                if (/[\\/]node_modules[\\/]three[\/].*loaders[\\/]KTX2Loader/.test(id)) return false
                return /[\\/]node_modules[\\/](three|three-stdlib)[\\/]/.test(id)
              },
              priority: 30,
            },
            {
              name: 'vendor-ui',
              test: /[\\/]node_modules[\\/](@studio-freight[\\/]lenis|uikit|lenis)[\\/]/,
              priority: 20,
            },
            {
              name: 'vendor-misc',
              // Same KTX2Loader exclusion — don't let the misc vendor group
              // eagerly pull the lazy transcoder into its merged chunk.
              test(id) {
                if (/[\\/]node_modules[\\/]three[\/].*loaders[\\/]KTX2Loader/.test(id)) return false
                return /[\\/]node_modules[\\/]/.test(id)
              },
              priority: 10,
            },
            // ── App chunks (lower priority). `name(id)` returns the chunk
            //    name based on src path, or null to fall through to
            //    rolldown's automatic chunking. Order matters — most
            //    specific paths first.
            {
              name(id) {
                if (id.includes('/src/core/Section')) return 'chunk-sections'
                if (id.includes('/src/shaders/')) return 'chunk-shaders'
                if (id.includes('/src/Experience/Camera')) return 'chunk-camera'
                if (id.includes('/src/Experience/Cursor')) return 'chunk-cursor'
                if (id.includes('/src/Experience/WebGLText')) return 'chunk-text'
                if (id.includes('/src/Experience/World/')) return 'chunk-world'
                if (id.includes('/src/core/World')) return 'chunk-core-world'
                if (id.includes('/src/Experience/Renderer')) return 'chunk-renderer'
                if (id.includes('/src/core/PostProcessingManager')) return 'chunk-post'
                if (id.includes('/src/core/AssetManager')) return 'chunk-assets'
                if (id.includes('/src/core/')) return 'chunk-core'
                if (id.includes('/src/UI/')) return 'chunk-ui'
                if (id.includes('/src/Experience/')) return 'chunk-experience'
                return null
              },
              priority: 5,
            },
          ],
        },
      },
    },
    minify: 'esbuild',
  },
  plugins: [
    {
      // Prerender the 6 home sections into index.html at build time so
      // crawlers (and users with JS disabled / failing) see the real text
      // content immediately instead of an empty <div id="app"></div>.
      // router.ts skips re-injection when #spa-content already has children,
      // so the prerendered HTML is hydrated (UIkit.init) not replaced.
      name: 'prerender-home',
      transformIndexHtml(html) {
        const sections = homePage()
        return html.replace(
          '<div id="app"></div>',
          `<div id="app"><main id="spa-content" role="main">${sections}</main></div>`,
        )
      },
    },
    {
      name: 'copy-projects',
      closeBundle() {
        const projects = readdirSync(resolve(__dirname, 'projects'))
        mkdirSync(resolve(__dirname, 'dist', 'projects'), { recursive: true })
        projects
          .filter((f) => f.endsWith('.html'))
          .forEach((f) =>
            copyFileSync(
              resolve(__dirname, 'projects', f),
              resolve(__dirname, 'dist', 'projects', f),
            ),
          )
      },
    },
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  server: {
    // Disable HMR — when accessing through a reverse proxy (Caddy gateway),
    // the HMR WebSocket connection is unstable (proxy idle timeout ~30s).
    // When the WebSocket disconnects, Vite client triggers location.reload(),
    // causing the page to reload every ~30 seconds.
    // HMR is only useful for local development on localhost:5173.
    hmr: false,
    // Allow the reverse proxy host so Vite doesn't block requests from
    // project.6la.ru (Caddy forwards to localhost:5173).
    allowedHosts: ['project.6la.ru'],
  },
})
