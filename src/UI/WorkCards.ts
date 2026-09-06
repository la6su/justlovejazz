// WorkCards.ts — semantic controls for real 3D Works planes.
//
// Visible project media and motion live in WorksPlaneStage. These native
// buttons remain as focusable caption/hit-target layers and request a project
// opening via jlz:open-project; Experience chooses the corresponding 3D plane.
//
// Card focus uses Tab/Shift+Tab (roving tabindex within each .jlz-works-grid).
// Story arrows are owned by CinematicNav; Enter/Space open the focused card
// through native <button> behavior.
//
// init() is idempotent — safe to call on every route change.

import { eventBus } from '../core/EventBus'

interface CardState {
  el: HTMLElement
  _clickDebounce?: boolean
  releaseTimer?: number
}

let cards: CardState[] = []
const cardStates = new WeakMap<HTMLElement, CardState>()
const gridListeners = new Map<HTMLElement, (event: MouseEvent) => void>()
let sectionChangeUnsub: (() => void) | null = null

function contentRoot(): ParentNode {
  return document.getElementById('spa-content') ?? document
}

/** Open one card while preserving the same debounce and visual handoff. */
function openCard(state: CardState): void {
  const idx = Number(state.el.dataset.projectIdx)
  if (Number.isNaN(idx)) return
  // The clicked 3D plane begins expanding in the same event turn. Delaying
  // this dispatch would leave a perceptible gap between DOM activation and
  // the shader-driven fullscreen transition.
  if (state._clickDebounce) return
  state._clickDebounce = true
  state.el.classList.add('is-opening')
  eventBus.emit('jlz:open-project', { idx })
  state.releaseTimer = window.setTimeout(() => {
    state.releaseTimer = undefined
    state._clickDebounce = false
    state.el.classList.remove('is-opening')
  }, 700)
}

/** Register one card in the delegated grid owner. */
function bindCard(cardEl: HTMLElement): void {
  if (cardEl.dataset.jlzBound === '1') return
  cardEl.dataset.jlzBound = '1'

  const state: CardState = { el: cardEl }
  cardStates.set(cardEl, state)
  cards.push(state)
}

/** Own one delegated click listener for a whole grid. */
function bindGrid(grid: HTMLElement): void {
  if (gridListeners.has(grid)) return
  const listener = (event: MouseEvent): void => {
    const target = (event.target as Element | null)?.closest<HTMLElement>('.jlz-work-card')
    if (!target || !grid.contains(target)) return
    const state = cardStates.get(target)
    if (state) openCard(state)
  }
  grid.addEventListener('click', listener)
  gridListeners.set(grid, listener)
}

/** All card grids on the page, in DOM order (matches section order). */
function grids(): HTMLElement[] {
  return Array.from(contentRoot().querySelectorAll<HTMLElement>('.jlz-works-grid'))
}

/** Apply roving tabindex to a single grid: first card = 0, rest = -1. */
function applyRoving(grid: HTMLElement): void {
  const gridCards = Array.from(grid.querySelectorAll<HTMLElement>('.jlz-work-card'))
  gridCards.forEach((card, i) => {
    card.setAttribute('tabindex', i === 0 ? '0' : '-1')
  })
}

/** jlz:page-section-change handler — reset roving in ALL grids. */
function onPageSectionChange(): void {
  grids().forEach(applyRoving)
}

/** Scan the document for .jlz-work-card and bind any unbound ones.
 *  Called on jlz:route-change (works page render). Idempotent. */
export function initWorkCards(): void {
  const els = contentRoot().querySelectorAll<HTMLElement>('.jlz-work-card')
  for (const el of els) bindCard(el)

  grids().forEach((grid) => {
    bindGrid(grid)
    applyRoving(grid)
  })

  if (!sectionChangeUnsub) {
    sectionChangeUnsub = eventBus.on('jlz:page-section-change', () => onPageSectionChange())
  }
}

/** Remove all card listeners (e.g. on full teardown). */
export function disposeWorkCards(): void {
  for (const [grid, listener] of gridListeners) {
    grid.removeEventListener('click', listener)
  }
  gridListeners.clear()
  for (const c of cards) {
    if (c.releaseTimer !== undefined) clearTimeout(c.releaseTimer)
    cardStates.delete(c.el)
    c.el.dataset.jlzBound = ''
    c.el.removeAttribute('tabindex')
  }
  cards = []
  if (sectionChangeUnsub) {
    sectionChangeUnsub()
    sectionChangeUnsub = null
  }
}
