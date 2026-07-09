import { defineConfig } from 'vite'
import { resolve } from 'node:path'

import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import { homePage } from './src/templates'

// ── Landing page content (prerendered, no-JS, semantic HTML5) ──
// Uses UIkit 3 classes (uk-section, uk-container, uk-grid, uk-card, etc)
// + JLZ semantic classes. The landing.less stylesheet provides UIkit +
// QF theme + JLZ tokens. No three.js, no app-specific JS.
function landingContent(): string {
  return `
      <section id="intro" class="uk-section uk-section-large uk-text-center" aria-labelledby="intro-title">
        <div class="uk-container uk-container-expand">
          <p class="jlz-landing-eyebrow">&gt; WEB DESIGN STUDIO · EST. 2019</p>
          <h1 id="intro-title" class="uk-heading-xlarge uk-margin-remove">JUSTLOVEJAZZ</h1>
          <p class="uk-text-lead uk-margin-top">glass · motion · light — powered by WebGPU. A studio crafting expressive browser experiences.</p>
          <a href="/app" class="jlz-landing-cta">Launch full 3D experience →</a>
        </div>
      </section>

      <section id="about" class="uk-section uk-section-large" aria-labelledby="about-title">
        <div class="uk-container uk-container-expand">
          <p class="jlz-landing-eyebrow">&gt; ABOUT</p>
          <h2 id="about-title" class="uk-heading-large uk-margin-remove-top">About</h2>
          <p class="uk-text-lead">A small studio crafting expressive browser experiences. We merge art direction with web engineering — 3D-first interfaces, spatial design, and real-time shaders that stay fast under pressure.</p>
          <div class="uk-grid uk-child-width-1-3@m uk-margin-medium-top" uk-grid>
            <div class="uk-card uk-card-default uk-card-body uk-text-center">
              <h3 class="uk-card-title uk-margin-remove">7+ Years</h3>
              <p class="uk-text-meta uk-margin-small-top">Crafting interactive web experiences</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body uk-text-center">
              <h3 class="uk-card-title uk-margin-remove">40+ Projects</h3>
              <p class="uk-text-meta uk-margin-small-top">From shader art to shipping product</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body uk-text-center">
              <h3 class="uk-card-title uk-margin-remove">12 Awards</h3>
              <p class="uk-text-meta uk-margin-small-top">Recognition for craft and innovation</p>
            </div>
          </div>
        </div>
      </section>

      <section id="works" class="uk-section uk-section-large" aria-labelledby="works-title">
        <div class="uk-container uk-container-expand">
          <p class="jlz-landing-eyebrow">&gt; SELECTED WORK</p>
          <h2 id="works-title" class="uk-heading-large uk-margin-remove-top">Works</h2>
          <p class="uk-text-lead">Six interactive experiences — each carries its own material preset.</p>
          <div class="uk-grid uk-child-width-1-2@s uk-child-width-1-3@m uk-margin-medium-top" uk-grid>
            <article class="uk-card uk-card-default uk-card-body uk-card-hover">
              <h3 class="uk-card-title">Undercurrent</h3>
              <p class="uk-text-meta">WebGPU fluid simulation · 2026</p>
            </article>
            <article class="uk-card uk-card-default uk-card-body uk-card-hover">
              <h3 class="uk-card-title">Mono Sunday</h3>
              <p class="uk-text-meta">Minimal portfolio · 2026</p>
            </article>
            <article class="uk-card uk-card-default uk-card-body uk-card-hover">
              <h3 class="uk-card-title">Till at Night</h3>
              <p class="uk-text-meta">Audio-reactive 3D · 2025</p>
            </article>
            <article class="uk-card uk-card-default uk-card-body uk-card-hover">
              <h3 class="uk-card-title">Ebb Vibes</h3>
              <p class="uk-text-meta">Generative typography · 2025</p>
            </article>
            <article class="uk-card uk-card-default uk-card-body uk-card-hover">
              <h3 class="uk-card-title">Nocturne Blue</h3>
              <p class="uk-text-meta">Shader-driven hero · 2025</p>
            </article>
            <article class="uk-card uk-card-default uk-card-body uk-card-hover">
              <h3 class="uk-card-title">Velvet Echo</h3>
              <p class="uk-text-meta">Glassmorphism system · 2024</p>
            </article>
          </div>
        </div>
      </section>

      <section id="process" class="uk-section uk-section-large" aria-labelledby="process-title">
        <div class="uk-container uk-container-expand">
          <p class="jlz-landing-eyebrow">&gt; PROCESS</p>
          <h2 id="process-title" class="uk-heading-large uk-margin-remove-top">How We Work</h2>
          <div class="uk-grid uk-child-width-1-2@s uk-child-width-1-4@m uk-margin-medium-top" uk-grid>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-card-title">01 Discover</h3>
              <p class="uk-text-meta">Research, audit, define the problem.</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-card-title">02 Design</h3>
              <p class="uk-text-meta">Art direction, 3D, interaction prototypes.</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-card-title">03 Develop</h3>
              <p class="uk-text-meta">WebGPU, TSL shaders, performance budgets.</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-card-title">04 Ship</h3>
              <p class="uk-text-meta">Launch, measure, evolve.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" class="uk-section uk-section-large uk-text-center" aria-labelledby="contact-title">
        <div class="uk-container uk-container-expand">
          <p class="jlz-landing-eyebrow">&gt; CONTACT</p>
          <h2 id="contact-title" class="uk-heading-large uk-margin-remove-top">Let's build together</h2>
          <p class="uk-text-lead">Ready to craft something extraordinary? We're open for new projects.</p>
          <a href="mailto:hello@justlovejazz.com" class="jlz-landing-cta">hello@justlovejazz.com</a>
        </div>
      </section>
  `
}

export default defineConfig({
  base: '/',
  publicDir: 'public',
  build: {
    target: 'es2023',
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    rollupOptions: {
      // Multi-page entry: index (/) → app (/app) → landing (/landing).
      // index.html is the FCP-critical splash (~12KB inline). app.html is
      // the full 3D experience. landing.html is the no-JS semantic fallback.
      // Vite dev server serves index.html at / by default (no .html needed).
      // app.html and landing.html are served at /app.html and /landing.html
      // in dev; in build, they're at /app.html and /landing.html too
      // (Vite preserves the filenames).
      input: {
        index: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
        landing: resolve(__dirname, 'landing.html'),
        blog: resolve(__dirname, 'blog.html'),
        // Blog articles — each is a standalone semantic HTML page
        'blog/undercurrent-webgpu-fluid': resolve(__dirname, 'blog/undercurrent-webgpu-fluid.html'),
        'blog/glassmorphism-webgpu': resolve(__dirname, 'blog/glassmorphism-webgpu.html'),
        'blog/on-demand-rendering': resolve(__dirname, 'blog/on-demand-rendering.html'),
        'blog/tsl-changes-everything': resolve(__dirname, 'blog/tsl-changes-everything.html'),
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
              test: /[\\/]node_modules[\\/]uikit[\\/]/,
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
        return html.replace(
          /<script[^>]*src="[^"]*\/@vite\/client[^"]*"[^>]*><\/script>\s*/g,
          '',
        )
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.includes('/@vite/client')) {
            res.setHeader('Content-Type', 'text/javascript')
            res.end([
              '// Vite client stub — prevents reload loop through proxy',
              'export function createHotContext() { return { accept() {}, dispose() {}, prune() {} } }',
              'export function updateStyle() {}',
              'export function removeStyle() {}',
              'export function defineDevServer() {}',
              'export const transport = null',
            ].join('\n'))
            return
          }
          next()
        })
      },
    },
    {
      // Prerender the 6 home sections into app.html at build time so the
      // 3D app boots with DOM content already present (router.ts skips
      // re-injection when #spa-content already has children → the prerendered
      // HTML is hydrated by UIkit.init, not replaced).
      name: 'prerender-app',
      transformIndexHtml(html, ctx) {
        // Only inject into app.html (not index/landing).
        if (!ctx.path.includes('app.html')) return html
        const sections = homePage()
        return html.replace(
          '<div id="app"></div>',
          `<div id="app"><main id="spa-content" role="main">${sections}</main></div>`,
        )
      },
    },
    {
      // Inject semantic no-JS content into landing.html at build time.
      // landing.html is the prerendered fallback — no three.js, no UIkit,
      // just semantic HTML5 + CSS for crawlers and no-JS users.
      name: 'prerender-landing',
      transformIndexHtml(html, ctx) {
        if (!ctx.path.includes('landing.html')) return html
        return html.replace(
          '<!-- LANDING_CONTENT_PLACEHOLDER -->',
          landingContent(),
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
    hmr: false,
    // Allow the reverse proxy host so Vite doesn't block requests from
    // project.6la.ru (Caddy forwards to localhost:5173).
    allowedHosts: ['project.6la.ru'],
  },
})
