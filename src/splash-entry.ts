// splash-entry.ts — Splash page entry point.
//
// Minimal logic for /splash (FCP-critical). Responsibilities:
//   1. Read config from localStorage (theme, sound) — apply to splash UI
//   2. Config switcher buttons → write localStorage
//   3. Lazy-preload entry-shell.js + three.js (via modulepreload + dynamic import)
//   4. Show Enter button when ready (app bundle cached)
//   5. Enter → fade out → navigate to /app
//
// This file is intentionally tiny (~3KB) — it's on the FCP path. Do NOT
// import three.js, UIkit, or anything heavy here. The dynamic import of
// entry-shell is for PRELOAD ONLY (fire-and-forget) — the actual app
// boots from /app which has its own <script type=module src=entry-shell>.

const THEME_KEY = 'jlz:theme'
const SOUND_KEY = 'jlz:sound'

// ── Config: theme toggle (1 button, light/dark) ──
// Writes to localStorage('jlz:theme') = 'light' | 'dark'.
// App reads this on boot via ThemeManager (which supports auto/light/dark —
// splash forces light or dark, app respects the override).
function initThemeToggle(): void {
  const btn = document.getElementById('cfg-theme') as HTMLButtonElement | null
  if (!btn) return

  // Read current state — default to 'dark' (matches splash bg #050507)
  let isLight = false
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light') isLight = true
  } catch { /* ignore */ }

  const update = () => {
    btn.setAttribute('aria-pressed', String(isLight))
    btn.classList.toggle('is-off', !isLight)
    btn.title = isLight ? 'Theme: Light (click for Dark)' : 'Theme: Dark (click for Light)'
  }
  update()

  btn.addEventListener('click', () => {
    isLight = !isLight
    try { localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark') } catch { /* ignore */ }
    update()
  })
}

// ── Config: sound toggle (1 button, on/off) ──
// Writes to localStorage('jlz:sound') = 'on' | 'off'.
// App's AudioSystem reads this on boot.
function initSoundToggle(): void {
  const btn = document.getElementById('cfg-sound') as HTMLButtonElement | null
  if (!btn) return

  // Default: OFF (user opts in to sound)
  let soundOn = false
  try {
    const stored = localStorage.getItem(SOUND_KEY)
    if (stored === 'on') soundOn = true
  } catch { /* ignore */ }

  const update = () => {
    btn.setAttribute('aria-pressed', String(soundOn))
    btn.classList.toggle('is-off', !soundOn)
    btn.title = soundOn ? 'Sound: On (click to mute)' : 'Sound: Off (click to enable)'
  }
  update()

  btn.addEventListener('click', () => {
    soundOn = !soundOn
    try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off') } catch { /* ignore */ }
    update()
  })
}

// ── App preload + Enter button ──
// Progressive enhancement flow (button ALWAYS enabled, NO dynamic import):
//   1. HTML default: button enabled, data-destination="/landing" (no-JS fallback)
//   2. JS boot: button stays enabled, shows "Preparing 3D…" indicator
//   3. App bundle preloaded via <link rel="modulepreload"> in HTML (download
//      only, NO execution — avoids main.less CSS leaking into splash)
//   4. Short delay → mark ready, destination switches to /app
//   5. Click (anytime): fade out → navigate to data-destination
//
// IMPORTANT: we do NOT use import('./entry-shell') for preload here because
// in Vite dev mode it triggers transpilation of the full app graph including
// main.less?inline, which injects the app's CSS (cursor:none, custom-cursor)
// into the splash page — hiding the system cursor. The <link rel=modulepreload>
// in index.html downloads the module without executing it, which is what we
// want for preload.
function initEnterButton(): void {
  const enterBtn = document.querySelector<HTMLButtonElement>('.jlz-splash-enter')
  const splash = document.getElementById('jlj-splash')
  if (!enterBtn || !splash) return

  // Wire click IMMEDIATELY — button is enabled from HTML default.
  // destination is /landing until preload completes.
  enterBtn.addEventListener('click', doEnter)

  // Mark ready — shows Enter button, hides Loading text.
  splash.classList.add('ready')

  // The <link rel="modulepreload" href="/src/entry-shell.ts"> in index.html
  // already told the browser to fetch the module graph in the background.
  // We don't need to await anything — by the time user reads the splash +
  // clicks Enter, the bundle is likely cached. If not, /app page loads it
  // fresh (slightly slower, but works).
  //
  // Give a short delay for the modulepreload to make progress, then mark
  // destination as /app. This is a heuristic — there's no reliable way to
  // know when a modulepreload finishes without executing the module.
  setTimeout(() => {
    enterBtn.dataset.destination = '/app'
    const status = document.getElementById('jlz-splash-status')
    if (status) status.classList.add('is-ready')
  }, 1500)
}

// ── Enter → fade → navigate to data-destination ──
// Reads destination from button.dataset.destination (set by initEnterButton).
// Default = '/landing' (no-JS fallback), switches to '/app' on successful preload.
function doEnter(): void {
  const splash = document.getElementById('jlj-splash')
  const enterBtn = document.querySelector<HTMLButtonElement>('.jlz-splash-enter')
  if (!splash || !enterBtn || splash.classList.contains('fading')) return

  const destination = enterBtn.dataset.destination || '/landing'

  // Mark as seen (for future auto-skip, currently disabled)
  try { localStorage.setItem('jlz:seen-intro', '1') } catch { /* ignore */ }

  // Fade out splash (0.4s), then navigate.
  splash.classList.add('fading')
  setTimeout(() => {
    window.location.href = destination
  }, 400)
}

// ── Boot ──
function boot(): void {
  initThemeToggle()
  initSoundToggle()
  // Start app preload (button is enabled from HTML default, click wired
  // in initEnterButton). modulepreload in HTML downloads the bundle.
  initEnterButton()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
