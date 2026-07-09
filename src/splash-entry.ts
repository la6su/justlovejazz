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
// Progressive enhancement flow (revised — button ALWAYS enabled):
//   1. HTML default: button enabled, data-destination="/landing" (no-JS fallback)
//   2. JS boot: button stays enabled, shows "Loading…" indicator
//   3. import('./entry-shell') success → data-destination="/app", indicator hidden
//   4. Click (anytime): fade out → navigate to data-destination
//
// User can click Enter IMMEDIATELY (goes to /landing fallback). When app
// bundle is cached, destination silently switches to /app. No disabled state.
async function initEnterButton(): Promise<void> {
  const enterBtn = document.querySelector<HTMLButtonElement>('.jlz-splash-enter')
  const splash = document.getElementById('jlj-splash')
  if (!enterBtn || !splash) return

  // Wire click IMMEDIATELY — button is enabled from HTML default.
  // destination is /landing until preload completes.
  enterBtn.addEventListener('click', doEnter)

  // Mark ready — shows Enter button, hides Loading text.
  splash.classList.add('ready')

  // Fire-and-forget preload of the app module graph.
  // On success → switch destination to /app (button stays enabled).
  // On failure → destination stays /landing (graceful degradation).
  try {
    await import('./entry-shell')
    enterBtn.dataset.destination = '/app'
    // Hide "Preparing 3D…" status — app bundle is cached, Enter goes to /app.
    const status = document.getElementById('jlz-splash-status')
    if (status) status.classList.add('is-ready')
  } catch (err) {
    // Preload failed — keep destination as /landing (HTML default).
    // User can still click → landing; /app will re-fetch on direct load.
    console.warn('[splash] App preload failed (non-fatal, fallback to /landing):', err)
    // Update status to reflect fallback.
    const status = document.getElementById('jlz-splash-status')
    if (status) {
      status.textContent = 'Text view'
      status.classList.add('is-ready')
    }
  }
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
  // Start preloading app immediately (button is enabled from HTML default,
  // click is wired in initEnterButton). Preload runs in parallel.
  void initEnterButton().catch((err) => {
    console.warn('[splash] initEnterButton failed:', err)
    // Fallback: still show the button with /landing destination.
    const splash = document.getElementById('jlj-splash')
    if (splash) splash.classList.add('ready')
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
