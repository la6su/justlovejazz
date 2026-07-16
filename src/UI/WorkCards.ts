// WorkCards.ts — restrained depth interaction + project opening for Works.
//
// Each .jlz-work-card tilts toward the cursor via CSS custom properties
// (--rx/--ry) updated on pointermove. The inner .jlz-work-card__inner element
// consumes those vars in its transform: perspective() rotateX/Y.
//
// Clicking a card dispatches jlz:open-project { idx } → Experience.ts opens
// the fullscreen ProjectOverlay (same overlay as the home BakuCarousel).
//
// Keyboard navigation (a11y): roving tabindex within the active section's
// 2-card row. ArrowLeft/ArrowRight move focus between cards; ArrowUp/Down are
// left alone (joystick vertical section navigation). Enter/Space open the
// focused card (native <button> behavior — no handler needed).
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
  _clickDebounce?: boolean // D-25: rapid double-click guard
  openTimer?: number
  releaseTimer?: number
}

let cards: CardState[] = []
let globalRafScheduled = false
let sectionChangeHandler: ((e: Event) => void) | null = null

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
    // Keep a single transition in flight. The card gets a short, restrained
    // focus transition before the fullscreen modal takes over.
    if (state._clickDebounce) return
    state._clickDebounce = true
    cardEl.classList.add('is-opening')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    state.openTimer = window.setTimeout(
      () => {
        state.openTimer = undefined
        cardEl.classList.remove('is-opening')
        window.dispatchEvent(new CustomEvent('jlz:open-project', { detail: { idx } }))
        state.releaseTimer = window.setTimeout(() => {
          state.releaseTimer = undefined
          state._clickDebounce = false
        }, 100)
      },
      reducedMotion ? 80 : 620,
    )
  }

  cardEl.addEventListener('pointermove', state.pointerMove)
  cardEl.addEventListener('pointerleave', state.pointerLeave)
  cardEl.addEventListener('click', state.click)
  cards.push(state)
}

// ── Keyboard navigation (roving tabindex) ──────────────────────────────
//
// Layout: 4 sections × 2 cards. Each section's cards live inside one
// .jlz-works-grid. Cards are keyboard-reachable via Tab (roving tabindex).
//
// ArrowLeft/ArrowRight are NOT handled here — they are owned by JoystickNav
// for section navigation (vertical = sections 1-4, horizontal = Lab/Menu).
// Card focus cycling is via Tab/Shift+Tab (native browser tabindex).
//
// Roving tabindex: in each grid, exactly one card has tabindex=0 (the Tab
// entry point), the rest have tabindex=-1 (focusable via JS but not Tab).

/** All card grids on the page, in DOM order (matches section order). */
function grids(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.jlz-works-grid'))
}

/** Cards inside a specific grid, in DOM order. */
function cardsInGrid(grid: HTMLElement): HTMLElement[] {
  return Array.from(grid.querySelectorAll<HTMLElement>('.jlz-work-card'))
}

// (activeGrid removed — was only used by the deleted keyboard handler.)

/** Apply roving tabindex to a single grid: first card = 0, rest = -1. */
function applyRoving(grid: HTMLElement): void {
  const gridCards = cardsInGrid(grid)
  gridCards.forEach((card, i) => {
    card.setAttribute('tabindex', i === 0 ? '0' : '-1')
  })
}

// (moveFocus + onKeydown removed — ArrowLeft/Right now owned by JoystickNav
//  for section navigation. Card focus is via Tab/Shift+Tab only.)

/** jlz:page-section-change handler — when the active section changes, reset
 *  roving in ALL grids (new section's first card becomes Tab entry). */
function onPageSectionChange(): void {
  grids().forEach(applyRoving)
}

/** Scan the document for .jlz-work-card and bind any unbound ones.
 *  Called on jlz:route-change (works page render). Idempotent. */
export function initWorkCards(): void {
  const els = document.querySelectorAll<HTMLElement>('.jlz-work-card')
  for (const el of els) bindCard(el)

  // Initialize roving tabindex on all grids (first card per grid = Tab entry).
  grids().forEach(applyRoving)

  // Attach section-change handler once (keyboard handler removed — arrows
  // owned by JoystickNav for section navigation, card focus via Tab).
  if (!sectionChangeHandler) {
    sectionChangeHandler = onPageSectionChange
    window.addEventListener('jlz:page-section-change', sectionChangeHandler)
  }
}

/** Remove all card listeners (e.g. on full teardown). */
export function disposeWorkCards(): void {
  for (const c of cards) {
    if (c.openTimer !== undefined) clearTimeout(c.openTimer)
    if (c.releaseTimer !== undefined) clearTimeout(c.releaseTimer)
    if (c.pointerMove) c.el.removeEventListener('pointermove', c.pointerMove)
    if (c.pointerLeave) c.el.removeEventListener('pointerleave', c.pointerLeave)
    if (c.click) c.el.removeEventListener('click', c.click)
    c.el.dataset.jlzBound = ''
    // Reset tabindex so Tab order is clean if cards re-mount.
    c.el.removeAttribute('tabindex')
  }
  cards = []
  if (sectionChangeHandler) {
    window.removeEventListener('jlz:page-section-change', sectionChangeHandler)
    sectionChangeHandler = null
  }
}
