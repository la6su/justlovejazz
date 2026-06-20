// ProjectOverlay — Studio-grade UI synced with 3D carousel.
// Layout: title (left), counter (right top), description (bottom left),
// tags (bottom), nav arrows (screen sides). All token-driven.

import { type Project } from '../core/types'

export class ProjectOverlay {
  private container: HTMLElement
  private prevBtn!: HTMLButtonElement
  private nextBtn!: HTMLButtonElement
  private titleEl!: HTMLElement
  private indexEl!: HTMLElement
  private catEl!: HTMLElement
  private descEl!: HTMLElement
  private tagsEl!: HTMLElement
  private counterEl!: HTMLElement

  constructor() {
    this.container = document.createElement('div')
    this.container.className = 'jlz-works-ui'
    this.buildContent()
    document.body.appendChild(this.container)
  }

  private buildContent(): void {
    const svg_prev = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><polyline points="15 18 9 12 15 6"/></svg>'
    const svg_next = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><polyline points="9 18 15 12 9 6"/></svg>'

    this.container.innerHTML = [
      // Left nav arrow
      '<button class="jlz-works-nav jlz-works-nav--prev" aria-label="Previous project">' + svg_prev + '</button>',
      // Right nav arrow
      '<button class="jlz-works-nav jlz-works-nav--next" aria-label="Next project">' + svg_next + '</button>',
      // Top-left: index + title
      '<div class="jlz-works-info jlz-works-info--top">',
        '<div class="jlz-works-index"></div>',
        '<h2 class="jlz-works-title"></h2>',
        '<div class="jlz-works-category"></div>',
      '</div>',
      // Top-right: counter
      '<div class="jlz-works-counter"></div>',
      // Bottom-left: description + tags
      '<div class="jlz-works-info jlz-works-info--bottom">',
        '<p class="jlz-works-description"></p>',
        '<div class="jlz-works-tags"></div>',
      '</div>',
    ].join('')

    this.indexEl = this.container.querySelector('.jlz-works-index') as HTMLElement
    this.titleEl = this.container.querySelector('.jlz-works-title') as HTMLElement
    this.catEl = this.container.querySelector('.jlz-works-category') as HTMLElement
    this.descEl = this.container.querySelector('.jlz-works-description') as HTMLElement
    this.tagsEl = this.container.querySelector('.jlz-works-tags') as HTMLElement
    this.counterEl = this.container.querySelector('.jlz-works-counter') as HTMLElement
    this.prevBtn = this.container.querySelector('.jlz-works-nav--prev') as HTMLButtonElement
    this.nextBtn = this.container.querySelector('.jlz-works-nav--next') as HTMLButtonElement
  }

  show(project: Project, index: number, total: number): void {
    if (!project) return
    // Animate content change: fade out → update → fade in.
    this.container.classList.add('jlz-works-ui--changing')

    requestAnimationFrame(() => {
      this.indexEl.textContent = ('0' + (index + 1)).slice(-2)
      this.titleEl.textContent = (project.title || '').toUpperCase()
      this.catEl.textContent = (project.category || '') + ' · ' + (project.year || '')
      this.descEl.textContent = project.description || ''
      this.counterEl.textContent = (index + 1) + ' / ' + total

      // Tags
      const tags = project.tags ?? []
      this.tagsEl.innerHTML = tags
        .filter(Boolean)
        .map(t => '<span class="jlz-works-tag">' + t + '</span>')
        .join('')

      // Per-project accent glow on title
      const accent = (project.color || '#515d84').replace('#', '')
      this.titleEl.style.textShadow = '0 0 40px #' + accent + '30'

      requestAnimationFrame(() => {
        this.container.classList.remove('jlz-works-ui--changing')
      })
    })
  }

  setIndex(idx: number, total: number): void {
    this.counterEl.textContent = (idx + 1) + ' / ' + total
    this.indexEl.textContent = ('0' + (idx + 1)).slice(-2)
  }

  onPrev(cb: () => void): void {
    this.prevBtn.onclick = cb
  }

  onNext(cb: () => void): void {
    this.nextBtn.onclick = cb
  }

  hide(): void {
    this.container.style.opacity = '0'
    this.container.style.pointerEvents = 'none'
  }

  showContainer(): void {
    this.container.style.opacity = '1'
    this.container.style.pointerEvents = 'auto'
  }

  dispose(): void {
    this.container.remove()
  }
}
