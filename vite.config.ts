import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { templateCompilerOptions } from '@tresjs/core'
import { resolve } from 'node:path'

import { copyFileSync, mkdirSync, readFileSync, readdirSync } from 'fs'
import { jlzAdminPlugin } from './admin/vite-plugin'
import { BLOG_ARTICLES } from './src/core/blogPages'

// ═══════════════════════════════════════════════════════════════════════
// TREE-SHAKING (automatic — no extra config needed)
// ═══════════════════════════════════════════════════════════════════════
// CSS: UIKit 3 components are imported individually from LESS source
//   in src/assets/_import.less — only used components emit CSS rules.
//   Unused components (label, search, tab, drop, offcanvas, etc.) are
//   commented out and produce zero CSS output.
// JS:  Vite/Rolldown tree-shakes unused ESM exports automatically.
//   UIKit 3 is an ESM package — only imported JS modules are bundled.
// ═══════════════════════════════════════════════════════════════════════

export default defineConfig(({ mode }) => ({
  base: '/',
  optimizeDeps:
    mode === 'tres-spike'
      ? {
          // Do not scan the legacy production entry: it intentionally imports
          // WebGL-only compatibility modules that are outside this spike.
          entries: ['src/spikes/tres/unifiedProbeEntry.ts'],
          // Three's root, WebGPU and addon entry points share `three.core.js`
          // in the native ESM graph. Pre-bundling them independently gives the
          // addon a second root bundle and triggers Three's duplicate-instance
          // warning. Keep this dev-only spike on the package's shared ESM graph.
          exclude: [
            'three',
            'three/webgpu',
            'three/tsl',
            'three/addons/geometries/RoundedBoxGeometry.js',
            'three/addons/tsl/display/BloomNode.js',
          ],
        }
      : undefined,
  define: {
    __VUE_OPTIONS_API__: 'false',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  publicDir: 'public',
  build: {
    target: 'es2023',
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    rollupOptions: {
      // Multi-page entry: index (/) → blog (/blog).
      // index.html is the seamless 3D experience with inline splash overlay.
      // three.js loads LAZY (dynamic import) — does NOT block FCP.
      // Blog documents are SSG outputs: `scripts/prerender-blog.mjs` renders
      // `BlogPage.vue` (SFC shell + `content/blog/*.html` editorial sources)
      // and writes them to the Vite build inputs — `blog.html` (the index →
      // `/blog`) and `blog/<slug>.html` (the articles → `/blog/<slug>`) — the
      // same closed set the sitemap consumes (`src/core/blogPages.ts`). The
      // generated head is the single source for SEO/Open Graph/JSON-LD
      // (`src/core/blogMeta.ts`). Vite rewrites the stylesheet URL and ships
      // the body as static HTML (no application bundle, no 3D).
      input: {
        index: resolve(__dirname, 'index.html'),
        blog: resolve(__dirname, 'blog.html'),
        ...Object.fromEntries(
          BLOG_ARTICLES.map((article) => [
            `blog/${article.slug}`,
            resolve(__dirname, `blog/${article.slug}.html`),
          ]),
        ),
      },
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
        // ───────────────────────────────────────────────────────────────────
        codeSplitting: {
          // `includeDependenciesRecursively` defaults to true — captured
          // modules' transitive deps are pulled into the same group, which
          // keeps three.js's internal addons (ktx-parse, zstddec,
          // WorkerPool, …) inside vendor-three instead of leaking into app
          // chunks.
          groups: [
            // ── Vendor chunks (highest priority — matched first) ──────────
            // Vite injects this virtual module into the splash shell for
            // dynamic imports. Isolate it so the shell cannot inherit the
            // heavy 3D chunk that also uses the helper.
            {
              name: 'chunk-runtime',
              test: /\0vite\/preload-helper\.js$/,
              priority: 40,
            },
            {
              // Contact owns its GLTF/DRACO path and loads it only on that
              // route. Keep the loader implementations out of the shared
              // Three.js delivery without pulling their core dependencies
              // into the route chunk.
              name: 'vendor-three-contact-loaders',
              test: /[\\/]three[\\/]examples[\\/]jsm[\\/]loaders[\\/](?:GLTFLoader|DRACOLoader)\.js$/,
              includeDependenciesRecursively: false,
              priority: 35,
            },
            {
              name: 'vendor-three',
              // Match every Three.js and three-stdlib module.
              test(id) {
                return /[\\/]node_modules[\\/](three|three-stdlib)[\\/]/.test(id)
              },
              priority: 30,
            },
            {
              name: 'vendor-ui',
              test: /[\\/]node_modules[\\/]uikit[\\/]/,
              priority: 20,
            },
            {
              name: 'vendor-misc',
              test(id) {
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
    vue(templateCompilerOptions),
    // /admin/ is a separate development application. The plugin owns its
    // fixed-path save/compile API and apply:'serve' keeps it out of builds.
    jlzAdminPlugin(),
    {
      name: 'tres-spike-pages',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const entries: Record<string, string> = {
            '/__spikes/tres-manual': '/src/spikes/tres/manualProbeEntry.ts',
            '/__spikes/tres-unified': '/src/spikes/tres/unifiedProbeEntry.ts',
            '/__spikes/tres-loop': '/src/spikes/tres/loopProbeEntry.ts',
            '/__spikes/tres-representative': '/src/spikes/tres/representativeProbeEntry.ts',
            '/__spikes/tres-resource': '/src/spikes/tres/resourceProbeEntry.ts',
          }
          const entry = req.url ? entries[req.url.split('?')[0] ?? ''] : undefined
          if (!entry) return next()
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(
            `<!doctype html><html><head><link rel="icon" href="/favicon.svg"></head><body><div id="app"></div><script type="module" src="${entry}"></script></body></html>`,
          )
        })
      },
    },
    {
      // Strip @vite/client from HTML + intercept the HTTP request.
      // Through the Caddy/XTransformPort gateway, /@vite/client resolves to
      // the Next.js app (port 3000) which returns HTML instead of JS — this
      // breaks all module loading. We need to: (1) remove the script tag from
      // HTML so the browser never requests it, and (2) return a stub for
      // direct localhost access.
      name: 'block-vite-client',
      apply: 'serve',
      transformIndexHtml(html) {
        // Remove the @vite/client script tag from the HTML
        return html.replace(/<script[^>]*src="[^"]*\/@vite\/client[^"]*"[^>]*><\/script>\s*/g, '')
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.includes('/@vite/client')) {
            res.setHeader('Content-Type', 'text/javascript')
            res.end(
              [
                '// Vite client stub — prevents reload loop through proxy',
                'export function createHotContext() {',
                '  return { accept() {}, dispose() {}, prune() {}, on() {}, off() {}, send() {}, invalidate() {}, decline() {} }',
                '}',
                'export function updateStyle() {}',
                'export function removeStyle() {}',
                'export function defineDevServer() {}',
                'export const transport = null',
              ].join('\n'),
            )
            return
          }
          next()
        })
      },
    },
    {
      // Prerender the 6 home sections into index.html at build time so the
      // 3D app boots with DOM content already present (SEO, the no-scene
      // contract, domcontentloaded e2e assertions). The source is the home
      // SFC SSR'd by `scripts/prerender-home.mjs` (single source of truth) —
      // the prerendered shell is REPLACED, not hydrated, by the Vue client on
      // mount.
      name: 'prerender-index',
      transformIndexHtml(html, ctx) {
        // Only inject into index.html (not blog).
        if (!ctx.path.endsWith('index.html')) return html
        const prerender = readFileSync(resolve(__dirname, 'prerender', 'home.html'), 'utf8')
        return html.replace('<div id="app"></div>', `<div id="app">${prerender}</div>`)
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
        rewriteUrls: 'all',
      },
    },
  },
  server: {
    // Disable HMR — when accessing through a reverse proxy (Caddy gateway),
    // the HMR WebSocket connection is unstable (proxy idle timeout ~30s).
    // When the WebSocket disconnects, Vite client triggers location.reload(),
    // causing the page to reload every ~30 seconds.
    hmr: false,
    // Allow the reverse proxy host so Vite doesn't block requests from
    // project.6la.ru (Caddy forwards to localhost:5173).
    allowedHosts: true, // TEMP,
  },
}))
