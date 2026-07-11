// ProjectOverlay — Fullscreen works mode UI.
//
// When Show button clicked: fullscreen overlay with cube + UI inside.
// UI: title (top-left), counter (top-right), prev/next arrows (screen sides),
// description (bottom), close button (top-right). Arrow nav works inside.
// Esc closes. Cursor visible (pointer-events: auto on overlay).

import { type Project } from '../core/types'
import { BlurFade } from '../Experience/BlurFade'

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
  private _isOpen = false
  private _previouslyFocused: HTMLElement | null = null
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null

  public onPrev: (() => void) | null = null
  public onNext: (() => void) | null = null
  public onClose: (() => void) | null = null
  private readonly sfx?: { play: (name: 'hover' | 'click' | 'open' | 'close') => void }

  constructor(protected _root: HTMLElement, sfx?: { play: (name: 'hover' | 'click' | 'open' | 'close') => void }) {
    this.sfx = sfx
    // Attach to document.body — NOT to the section. A section ancestor with a
    // CSS transform (UIkit scrollspy uk-animation-scale-up) creates a new
    // containing block, making position:fixed relative to the section instead
    // of the viewport. Body-attached overlay is always full-viewport.
    const existing = document.getElementById('project-overlay')
    this.container = existing ?? document.createElement('div')
    if (!existing) {
      this.container.id = 'project-overlay'
    }
    // Always attach to body — if the overlay was prerendered inside a section
    // (templates.ts has it inside #section-challenge), move it to body so
    // position:fixed is viewport-relative (section transforms break fixed).
    if (this.container.parentElement !== document.body) {
      document.body.appendChild(this.container)
    }
    this.build()
    this.hide()
  }

  private build(): void {
    this.container.setAttribute('role', 'dialog')
    this.container.setAttribute('aria-modal', 'true')
    this.container.setAttribute('aria-label', 'Project details')
    // Container shell is styled via #project-overlay in main.less
    // (position:fixed, inset:0, pointer-events toggled by .is-open).
    // Child elements use UIKit utility classes (uk-position-*, uk-flex-*)
    // + bespoke .jlz-fs-* classes for project-specific styling.
    this.container.innerHTML = `
      <div class="jlz-fs-bg uk-position-cover"></div>
      <div class="jlz-fs-top uk-position-top-left uk-flex uk-flex-between uk-flex-middle uk-width-1-1 uk-padding">
        <div>
          <div class="jlz-fs-cat uk-text-uppercase"></div>
          <h2 class="jlz-fs-title uk-margin-remove"></h2>
        </div>
        <div class="jlz-fs-top__right uk-flex uk-flex-middle">
          <div class="jlz-fs-counter"></div>
          <button class="jlz-fs-close" type="button" aria-label="Close" uk-close></button>
        </div>
      </div>
      <button class="jlz-fs-prev uk-position-center-left uk-flex uk-flex-middle" type="button" aria-label="Previous" uk-slidenav-previous></button>
      <button class="jlz-fs-next uk-position-center-right uk-flex uk-flex-middle" type="button" aria-label="Next" uk-slidenav-next></button>
      <div class="jlz-fs-bottom uk-position-bottom uk-flex uk-flex-bottom uk-width-1-1 uk-padding">
        <div class="jlz-fs-thumb"></div>
        <div class="uk-flex-1">
          <p class="jlz-fs-desc uk-margin-remove"></p>
          <div class="jlz-fs-tags uk-flex uk-flex-wrap uk-margin-small-top"></div>
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
    // Set global flag so BakuCarousel keyboard handler can skip ArrowLeft/Right
    // (prevents double-trigger: both overlay and carousel handling same key).
    ;(window as unknown as { jlzOverlayOpen?: boolean }).jlzOverlayOpen = true
    // Visibility/opacity/pointer-events handled by .is-open class in main.less.
    this.container.classList.add('is-open')
    // Lock background scroll — body overflow:hidden is enough (the page doesn't
    // actually scroll, but this is a defensive measure for any future scroll).
    document.body.style.overflow = 'hidden'
    // Record the element that had focus before opening so we can restore it.
    this._previouslyFocused = document.activeElement as HTMLElement | null
    // Move focus into the dialog (close button) so keyboard users land inside.
    requestAnimationFrame(() => this.closeBtn.focus())
    this.sfx?.play('open')
  }

  hide(): void {
    this._isOpen = false
    // Clear global flag — BakuCarousel can handle keys again.
    ;(window as unknown as { jlzOverlayOpen?: boolean }).jlzOverlayOpen = false
    // Visibility/opacity/pointer-events handled by .is-open class in main.less.
    this.container.classList.remove('is-open')
    // Unlock background scroll.
    document.body.style.overflow = ''
    // Restore focus to the element that opened the dialog (WCAG 2.4.3).
    this._previouslyFocused?.focus?.()
    this._previouslyFocused = null
    this.sfx?.play('close')
  }

  show(project: Project, index: number, total: number): void {
    this.catEl.textContent = `${project.year ?? ''} · ${project.category ?? ''}`
    BlurFade.for(this.titleEl).show(0.8, project.title)
    this.descEl.textContent = project.description || ''
    this.counterEl.textContent = `${index + 1} / ${total}`
    this.tagsEl.innerHTML = (project.tags ?? [])
      .filter(Boolean)
      .map((t) => `<span class="jlz-fs-tag">${t}</span>`)
      .join('')
    // Update thumbnail preview if exists
    const thumb = this.container.querySelector('.jlz-fs-thumb') as HTMLElement | null
    if (thumb) {
      const url = project.detailTextureUrl || project.textureUrl
      if (url) thumb.style.backgroundImage = `url('${url}')`
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
