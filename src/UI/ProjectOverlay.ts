// ProjectOverlay — Fullscreen works mode UI.
//
// When Show button clicked: fullscreen overlay with cube + UI inside.
// UI: title (top-left), counter (top-right), prev/next arrows (screen sides),
// description (bottom), close button (top-right). Arrow nav works inside.
// Esc closes. Cursor visible (pointer-events: auto on overlay).

import { type Project } from '../core/types'
import { NoiseText } from '../Experience/NoiseText'

export class ProjectOverlay {
  private container: HTMLElement
  private prevBtn!: HTMLButtonElement
  private nextBtn!: HTMLButtonElement
  private closeBtn!: HTMLButtonElement
  private titleEl!: HTMLElement
  private catEl!: HTMLElement
  private descEl!: HTMLElement
  private tagsEl!: HTMLElement
  private counterEl!: HTMLElement
  private _first = true
  private _isOpen = false
  private _previouslyFocused: HTMLElement | null = null
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null

  public onPrev: (() => void) | null = null
  public onNext: (() => void) | null = null
  public onClose: (() => void) | null = null

  constructor(protected root: HTMLElement) {
    const existing =
      (root.querySelector('#project-overlay') as HTMLElement | null) ||
      document.getElementById('project-overlay')
    this.container = existing ?? document.createElement('div')
    if (!existing) {
      this.container.id = 'project-overlay'
      root.appendChild(this.container)
    }
    this.build()
    this.hide()
  }

  private build(): void {
    this.container.setAttribute('role', 'dialog')
    this.container.setAttribute('aria-modal', 'true')
    this.container.setAttribute('aria-label', 'Project details')
    this.container.style.cssText = `
      position:fixed;inset:0;z-index:3500;pointer-events:none;
      opacity:0;transition:opacity .4s ease;
    `
    this.container.innerHTML = `
      <div class="jlz-fs-bg" style="position:absolute;inset:0;background:rgba(2,2,6,.85);backdrop-filter:blur(8px);"></div>
      <div class="jlz-fs-top" style="position:absolute;top:0;left:0;width:100%;padding:2rem 2.5rem;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:auto;">
        <div>
          <div class="jlz-fs-cat" style="font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:.3rem;"></div>
          <h2 class="jlz-fs-title" style="font-size:clamp(1.5rem,4vw,2.5rem);font-weight:900;color:#fff;margin:0;"></h2>
        </div>
        <div style="display:flex;align-items:center;gap:1.5rem;">
          <div class="jlz-fs-counter" style="font-size:.8rem;color:rgba(255,255,255,.5);font-variant-numeric:tabular-nums;"></div>
          <button class="jlz-fs-close" type="button" aria-label="Close" style="background:none;border:1px solid rgba(255,255,255,.2);color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>
      </div>
      <button class="jlz-fs-prev" type="button" aria-label="Previous" style="position:absolute;left:1.5rem;top:50%;transform:translateY(-50%);background:none;border:1px solid rgba(255,255,255,.2);color:#fff;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:1.2rem;pointer-events:auto;">←</button>
      <button class="jlz-fs-next" type="button" aria-label="Next" style="position:absolute;right:1.5rem;top:50%;transform:translateY(-50%);background:none;border:1px solid rgba(255,255,255,.2);color:#fff;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:1.2rem;pointer-events:auto;">→</button>
      <div class="jlz-fs-bottom" style="position:absolute;bottom:0;left:0;width:100%;padding:2rem 2.5rem;pointer-events:auto;display:flex;align-items:flex-end;gap:2rem;">
        <div class="jlz-fs-thumb" style="width:120px;height:80px;background-size:cover;background-position:center;border-radius:6px;flex-shrink:0;border:1px solid rgba(255,255,255,.1);"></div>
        <div style="flex:1;">
          <p class="jlz-fs-desc" style="color:rgba(255,255,255,.6);font-size:.9rem;max-width:600px;margin:0 0 .8rem;"></p>
          <div class="jlz-fs-tags" style="display:flex;gap:.5rem;flex-wrap:wrap;"></div>
        </div>
      </div>
    `
    this.prevBtn = this.container.querySelector('.jlz-fs-prev')!
    this.nextBtn = this.container.querySelector('.jlz-fs-next')!
    this.closeBtn = this.container.querySelector('.jlz-fs-close')!
    this.titleEl = this.container.querySelector('.jlz-fs-title')!
    this.catEl = this.container.querySelector('.jlz-fs-cat')!
    this.descEl = this.container.querySelector('.jlz-fs-desc')!
    this.tagsEl = this.container.querySelector('.jlz-fs-tags')!
    this.counterEl = this.container.querySelector('.jlz-fs-counter')!

    this.prevBtn.addEventListener('click', () => this.onPrev?.())
    this.nextBtn.addEventListener('click', () => this.onNext?.())
    this.closeBtn.addEventListener('click', () => this.close())
    // Stored handler ref so dispose() can remove it (prevents leak across rebuilds).
    this._keydownHandler = (e: KeyboardEvent) => {
      if (!this._isOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        this.close()
        return
      }
      if (e.key === 'ArrowLeft') {
        this.onPrev?.()
      }
      if (e.key === 'ArrowRight') {
        this.onNext?.()
      }
      // Focus trap (WCAG 2.4.3) — keep Tab focus inside the dialog.
      if (e.key === 'Tab') {
        const focusable = this.container.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]!
        const last = focusable[focusable.length - 1]!
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', this._keydownHandler)
  }

  showContainer(): void {
    this._isOpen = true
    this.container.style.opacity = '1'
    this.container.style.pointerEvents = 'auto'
    // Lock background scroll — the overlay is fixed but the page behind would
    // still scroll (scroll-snap mandatory fights the overlay). Stop Lenis +
    // set body overflow:hidden.
    document.body.style.overflow = 'hidden'
    const exp = (window as unknown as { experience?: { smoothScroll?: { lenis: { stop: () => void } } } }).experience
    exp?.smoothScroll?.lenis?.stop()
    // Record the element that had focus before opening so we can restore it.
    this._previouslyFocused = document.activeElement as HTMLElement | null
    // Move focus into the dialog (close button) so keyboard users land inside.
    requestAnimationFrame(() => this.closeBtn.focus())
  }

  hide(): void {
    this._isOpen = false
    this.container.style.opacity = '0'
    this.container.style.pointerEvents = 'none'
    // Unlock background scroll.
    document.body.style.overflow = ''
    const exp = (window as unknown as { experience?: { smoothScroll?: { lenis: { start: () => void } } } }).experience
    exp?.smoothScroll?.lenis?.start()
    // Restore focus to the element that opened the dialog (WCAG 2.4.3).
    this._previouslyFocused?.focus?.()
    this._previouslyFocused = null
  }

  show(project: Project, index: number, total: number): void {
    this.catEl.textContent = `${project.year ?? ''} · ${project.category ?? ''}`
    NoiseText.for(this.titleEl).show(0.8, project.title)
    this.descEl.textContent = project.description || ''
    this.counterEl.textContent = `${index + 1} / ${total}`
    this.tagsEl.innerHTML = (project.tags ?? [])
      .filter(Boolean)
      .map(
        (t) =>
          `<span style="background:rgba(120,140,200,.15);color:#a0b0e0;padding:.2rem .6rem;border-radius:4px;font-size:.7rem;">${t}</span>`,
      )
      .join('')
    // Update thumbnail preview if exists
    const thumb = this.container.querySelector('.jlz-fs-thumb') as HTMLElement | null
    if (thumb) {
      const url = project.detailTextureUrl || project.textureUrl
      if (url) thumb.style.backgroundImage = `url('${url}')`
    }
    if (this._first) {
      this._first = false
    }
  }

  close(): void {
    this.hide()
    this.onClose?.()
  }

  dispose(): void {
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler)
      this._keydownHandler = null
    }
    this.container.remove()
  }
}
