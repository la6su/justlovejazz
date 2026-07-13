// WorkCards.ts — 3D tilt + click + keyboard handler for the works page card grid.
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
}

let cards: CardState[] = []
let globalRafScheduled = false
let keydownHandler: ((e: KeyboardEvent) => void) | null = null
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
    // Phase 5: trigger wobble pulse on cube before opening project
    window.dispatchEvent(new CustomEvent('jlz:wobble-pulse'))
    window.dispatchEvent(
      new CustomEvent('jlz:open-project', { detail: { idx } }),
    )
  }

  cardEl.addEventListener('pointermove', state.pointerMove)
  cardEl.addEventListener('pointerleave', state.pointerLeave)
  cardEl.addEventListener('click', state.click)
  cards.push(state)
}

// ── Keyboard navigation (roving tabindex) ──────────────────────────────────
//
// Layout: 4 sections × 2 cards. Each section's cards live inside one
// .jlz-works-grid. Only the active section's cards are keyboard-reachable
// via Tab; ArrowLeft/Right cycle focus within that row.
//
// Roving tabindex: in each grid, exactly one card has tabindex=0 (the Tab
// entry point), the rest have tabindex=-1 (focusable via JS but not Tab).
// ArrowLeft/Right move focus + update the roving anchor.

/** All card grids on the page, in DOM order (matches section order). */
function grids(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.jlz-works-grid'))
}

/** Cards inside a specific grid, in DOM order. */
function cardsInGrid(grid: HTMLElement): HTMLElement[] {
  return Array.from(grid.querySelectorAll<HTMLElement>('.jlz-work-card'))
}

/** Which grid is currently active (its parent section has .section-active)?
 *  Falls back to the first grid if none is active (initial load). */
function activeGrid(): HTMLElement | null {
  const gridsList = grids()
  if (gridsList.length === 0) return null
  for (const g of gridsList) {
    const section = g.closest('[data-page-section]')
    if (section?.classList.contains('section-active')) return g
  }
  return gridsList[0] ?? null
}

/** Apply roving tabindex to a single grid: first card = 0, rest = -1. */
function applyRoving(grid: HTMLElement): void {
  const gridCards = cardsInGrid(grid)
  gridCards.forEach((card, i) => {
    card.setAttribute('tabindex', i === 0 ? '0' : '-1')
  })
}

/** Move focus within a grid in the given direction (+1 = right, -1 = left).
 *  Wraps around at the edges. Updates the roving anchor so Tab re-enters
 *  at the newly-focused card. */
function moveFocus(grid: HTMLElement, dir: 1 | -1): void {
  const gridCards = cardsInGrid(grid)
  if (gridCards.length === 0) return
  const current = gridCards.findIndex((c) => c === document.activeElement)
  // If nothing focused yet, start at the roving anchor (tabindex=0).
  const startIdx = current >= 0 ? current : gridCards.findIndex((c) => c.getAttribute('tabindex') === '0')
  const baseIdx = startIdx >= 0 ? startIdx : 0
  const nextIdx = (baseIdx + dir + gridCards.length) % gridCards.length
  // Update roving: the newly-focused card becomes the Tab entry point.
  gridCards.forEach((card, i) => card.setAttribute('tabindex', i === nextIdx ? '0' : '-1'))
  gridCards[nextIdx]!.focus({ preventScroll: false })
}

/** Global keydown handler — processes ArrowLeft/ArrowRight when a card (or
 *  nothing in the active grid) is focused. ArrowUp/Down are intentionally
 *  ignored (joystick owns vertical section navigation). */
function onKeydown(e: KeyboardEvent): void {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  // Only act if focus is within a work card, OR within the active section
  // (so arrows work even before the user has tabbed into a card).
  const active = document.activeElement
  const grid = activeGrid()
  if (!grid) return
  const isOnCard = active instanceof HTMLElement && active.classList.contains('jlz-work-card')
  const isInActiveSection = active instanceof HTMLElement && grid.contains(active)
  if (!isOnCard && !isInActiveSection) {
    // Still allow arrows if the active section's grid has no focused element
    // — but only when focus is on body (post-tab-into-page state).
    if (active !== document.body) return
  }
  e.preventDefault()
  moveFocus(grid, e.key === 'ArrowRight' ? 1 : -1)
}

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

  // Attach keyboard + section-change handlers once.
  if (!keydownHandler) {
    keydownHandler = onKeydown
    document.addEventListener('keydown', keydownHandler)
  }
  if (!sectionChangeHandler) {
    sectionChangeHandler = onPageSectionChange
    window.addEventListener('jlz:page-section-change', sectionChangeHandler)
  }
}

/** Remove all card listeners (e.g. on full teardown). */
export function disposeWorkCards(): void {
  for (const c of cards) {
    if (c.pointerMove) c.el.removeEventListener('pointermove', c.pointerMove)
    if (c.pointerLeave) c.el.removeEventListener('pointerleave', c.pointerLeave)
    if (c.click) c.el.removeEventListener('click', c.click)
    c.el.dataset.jlzBound = ''
    // Reset tabindex so Tab order is clean if cards re-mount.
    c.el.removeAttribute('tabindex')
  }
  cards = []
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
    keydownHandler = null
  }
  if (sectionChangeHandler) {
    window.removeEventListener('jlz:page-section-change', sectionChangeHandler)
    sectionChangeHandler = null
  }
}
