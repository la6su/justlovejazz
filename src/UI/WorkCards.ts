// WorkCards.ts — 3D tilt + click handler for the works page card grid.
//
// Each .jlz-work-card tilts toward the cursor via CSS custom properties
// (--rx/--ry) updated on pointermove. The inner .jlz-work-card__inner element
// consumes those vars in its transform: perspective() rotateX/Y.
//
// Clicking a card dispatches jlz:open-project { idx } → Experience.ts opens
// the fullscreen ProjectOverlay (same overlay as the home BakuCarousel).
//
// init() is idempotent — safe to call on every route change. Listeners are
// attached per-card and tracked for cleanup.

const TILT_MAX = 8 // degrees — max rotateX/Y at card edges
const TILT_EASE = 0.18 // lerp factor for smooth follow

interface CardState {
  el: HTMLElement
  inner: HTMLElement
  targetRx: number
  targetRy: number
  currentRx: number
  currentRy: number
  rafId: number
  pointerMove: ((e: PointerEvent) => void) | null
  pointerLeave: (() => void) | null
  click: (() => void) | null
}

let cards: CardState[] = []
let globalRafScheduled = false

/** Update all card tilts in a single rAF pass (batched, not per-card). */
function tick(): void {
  globalRafScheduled = false
  let needsAnother = false
  for (const c of cards) {
    const dx = c.targetRx - c.currentRx
    const dy = c.targetRy - c.currentRy
    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
      c.currentRx += dx * TILT_EASE
      c.currentRy += dy * TILT_EASE
      c.inner.style.setProperty('--rx', `${c.currentRx.toFixed(2)}deg`)
      c.inner.style.setProperty('--ry', `${c.currentRy.toFixed(2)}deg`)
      needsAnother = true
    } else {
      c.currentRx = c.targetRx
      c.currentRy = c.targetRy
      c.inner.style.setProperty('--rx', `${c.currentRx.toFixed(2)}deg`)
      c.inner.style.setProperty('--ry', `${c.currentRy.toFixed(2)}deg`)
    }
  }
  if (needsAnother) scheduleTick()
}

function scheduleTick(): void {
  if (globalRafScheduled) return
  globalRafScheduled = true
  requestAnimationFrame(tick)
}

/** Attach listeners to one card. */
function bindCard(cardEl: HTMLElement): void {
  if (cardEl.dataset.jlzBound === '1') return
  cardEl.dataset.jlzBound = '1'

  const inner = cardEl.querySelector<HTMLElement>('.jlz-work-card__inner')
  if (!inner) return

  const state: CardState = {
    el: cardEl,
    inner,
    targetRx: 0,
    targetRy: 0,
    currentRx: 0,
    currentRy: 0,
    rafId: 0,
    pointerMove: null,
    pointerLeave: null,
    click: null,
  }

  state.pointerMove = (e: PointerEvent) => {
    const rect = cardEl.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width // 0..1
    const py = (e.clientY - rect.top) / rect.height // 0..1
    // Center-origin: -1..1. rotateY from horizontal, rotateX from vertical.
    state.targetRy = (px - 0.5) * 2 * TILT_MAX
    state.targetRx = -(py - 0.5) * 2 * TILT_MAX
    scheduleTick()
  }
  state.pointerLeave = () => {
    state.targetRx = 0
    state.targetRy = 0
    scheduleTick()
  }
  state.click = () => {
    const idx = Number(cardEl.dataset.projectIdx)
    if (Number.isNaN(idx)) return
    window.dispatchEvent(
      new CustomEvent('jlz:open-project', { detail: { idx } }),
    )
  }

  cardEl.addEventListener('pointermove', state.pointerMove)
  cardEl.addEventListener('pointerleave', state.pointerLeave)
  cardEl.addEventListener('click', state.click)
  cards.push(state)
}

/** Scan the document for .jlz-work-card and bind any unbound ones.
 *  Called on jlz:route-change (works page render). Idempotent. */
export function initWorkCards(): void {
  const els = document.querySelectorAll<HTMLElement>('.jlz-work-card')
  for (const el of els) bindCard(el)
}

/** Remove all card listeners (e.g. on full teardown). */
export function disposeWorkCards(): void {
  for (const c of cards) {
    if (c.pointerMove) c.el.removeEventListener('pointermove', c.pointerMove)
    if (c.pointerLeave) c.el.removeEventListener('pointerleave', c.pointerLeave)
    if (c.click) c.el.removeEventListener('click', c.click)
    c.el.dataset.jlzBound = ''
  }
  cards = []
}
