// src/splash.ts — instant splash screen (zero deps: no Three.js, no heavy imports)
// Purpose: paint immediately on FCP. Heavy app loads in background.

export type SplashOverlay = {
  show(): void
  hide(ms?: number): void
  remove(): void
}

/** Create a zero-dependency splash overlay. Renders synchronously. */
export function createSplash(): SplashOverlay {
  const id = 'jlj-splash'
  let el: HTMLElement | null = null

  function doShow() {
    if (el) return
    el = document.createElement('div')
    el.id = id
    el.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:#0a0a0a;
      display:flex;align-items:center;justify-content:center;flex-direction:column;
      opacity:1;transition:opacity .6s ease;
      will-change:opacity;
    `

    const logo = document.createElement('div')
    logo.style.cssText = `
      color:#fff;font:700 clamp(1.5rem,4vw,3rem) system-ui,-apple-system,sans-serif;
      letter-spacing:.3em;text-align:center;opacity:0;
      animation:splashIn .8s ease .15s forwards;
    `
    logo.textContent = 'JUSTLOVEJAZZ'
    el.appendChild(logo)

    const hint = document.createElement('div')
    hint.style.cssText = `
      position:absolute;bottom:20px;
      color:rgba(255,255,255,.35);font:600 .7rem system-ui,sans-serif;
      letter-spacing:.12em;cursor:pointer;opacity:0;
      animation:splashIn .5s ease 1s forwards;
    `
    hint.textContent = 'click to skip'
    hint.addEventListener('click', () => doHide())
    hint.addEventListener('touchend', () => doHide())
    el.appendChild(hint)

    if (!document.getElementById('jlj-splash-styles')) {
      const style = document.createElement('style')
      style.id = 'jlj-splash-styles'
      style.textContent = `@keyframes splashIn { to { opacity: 1; } }`
      document.head.appendChild(style)
    }

    document.body.prepend(el)
  }

  function doHide(ms: number = 600) {
    if (!el) return
    el.style.opacity = '0'
    setTimeout(() => {
      if (el) {
        el.remove()
        el = null
      }
    }, ms)
  }

  function doRemove() {
    if (!el) return
    el.remove()
    el = null
  }

  return {
    show: doShow,
    hide: doHide,
    remove: doRemove,
  }
}
