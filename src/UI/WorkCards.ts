// WorkCards.ts — semantic controls for real 3D Works planes.
//
// Visible project media and motion live in WorksPlaneStage. These native
// buttons remain as focusable caption/hit-target layers and request a project
// opening; Experience chooses the corresponding 3D plane when it exists.
//
// Clicking a card dispatches jlz:open-project { idx } → Experience.ts opens
// the fullscreen ProjectOverlay (same overlay as the home BakuCarousel).
//
// Keyboard navigation (a11y): roving tabindex within the active section's
// 2-card row. Story arrows are left to CinematicNav; Enter/Space open the
// focused card through native <button> behavior.
//
// init() is idempotent — safe to call on every route change. Listeners are
// attached per-card and tracked for cleanup.

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
  wobbleTimer?: number
}

let cards: CardState[] = []
let sectionChangeHandler: ((e: Event) => void) | null = null

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

  state.pointerMove = () => {}
  state.pointerLeave = () => {
    state.targetRx = 0
    state.targetRy = 0
  }
  state.click = () => {
    const idx = Number(cardEl.dataset.projectIdx)
    if (Number.isNaN(idx)) return
    // The clicked 3D plane begins expanding in the same event turn. Delaying
    // this dispatch would leave a perceptible gap between DOM activation and
    // the shader-driven fullscreen transition.
    if (state._clickDebounce) return
    state._clickDebounce = true
    cardEl.classList.add('is-opening')
    window.dispatchEvent(new CustomEvent('jlz:open-project', { detail: { idx } }))
    state.releaseTimer = window.setTimeout(() => {
      state.releaseTimer = undefined
      state._clickDebounce = false
      cardEl.classList.remove('is-opening')
    }, 700)
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
// ArrowLeft/ArrowRight are NOT handled here — CinematicNav owns them for the
// horizontal story.
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

// (moveFocus + onKeydown removed — story arrows are owned by CinematicNav.
//  Card focus is via Tab/Shift+Tab only.)

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

  // Attach section-change handler once (story arrows remain owned by
  // CinematicNav; card focus uses Tab).
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
    if (c.wobbleTimer !== undefined) clearTimeout(c.wobbleTimer)
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
