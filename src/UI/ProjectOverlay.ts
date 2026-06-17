// ProjectOverlay — UI overlay for active project info
import { type Project } from '../core/types'

export class ProjectOverlay {
  private container: HTMLElement
  private prevBtn!: HTMLButtonElement
  private nextBtn!: HTMLButtonElement
  private titleEl!: HTMLElement
  private indexEl!: HTMLElement
  private catEl!: HTMLElement
  private counterEl!: HTMLElement

  constructor() {
    this.container = document.createElement('div')
    this.container.className = 'project-overlay'
    // All visual styling lives in src/styles/tokens.css (.project-overlay*).
    // Only the per-project accent glow is set dynamically in show().
    this.buildContent()
    document.body.appendChild(this.container)
  }

  private buildContent(): void {
    // SVG stroke color uses currentColor so tokens.css can theme it via
    // .project-overlay__nav button { color: var(--jlz-color-text-muted) }.
    const svg_prev = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="15 18 9 12 15 6"/></svg>'
    const svg_next = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 18 15 12 9 6"/></svg>'
    this.container.innerHTML = [
      '<div class="project-overlay__index"></div>',
      '<div class="project-overlay__title"></div>',
      '<div class="project-overlay__category"></div>',
      '<div class="project-overlay__nav">',
        '<button class="prev" aria-label="Previous project">' + svg_prev + '</button>',
        '<span class="counter"></span>',
        '<button class="next" aria-label="Next project">' + svg_next + '</button>',
      '</div>',
    ].join('')
    this.indexEl = this.container.querySelector('.project-overlay__index') as HTMLElement
    this.titleEl = this.container.querySelector('.project-overlay__title') as HTMLElement
    this.catEl = this.container.querySelector('.project-overlay__category') as HTMLElement
    this.counterEl = this.container.querySelector('.project-overlay__nav .counter') as HTMLElement
    this.prevBtn = this.container.querySelector('.prev') as HTMLButtonElement
    this.nextBtn = this.container.querySelector('.next') as HTMLButtonElement
  }

  show(project: Project, index: number, total: number): void {
    if (!project) return // defensive: caller should clamp, but never crash here
    this.indexEl.textContent = ('0' + (index + 1)).slice(-2)
    this.titleEl.textContent = (project.title || '').toUpperCase()
    this.catEl.textContent = (project.category || '') + ' \u00b7 ' + (project.year || '')
    this.counterEl.textContent = (index + 1) + ' / ' + total
    const accent = (project.color || '#ffffff').replace('#', '')
    this.titleEl.style.textShadow = '0 0 30px #' + accent + '40'
    this.container.style.opacity = '1'
  }

  setIndex(idx: number, total: number): void {
    this.counterEl.textContent = (idx + 1) + ' / ' + total
  }

  onPrev(cb: () => void): void {
    this.prevBtn.onclick = cb
  }
  onNext(cb: () => void): void {
    this.nextBtn.onclick = cb
  }

  hide(): void {
    this.container.style.opacity = '0'
  }

  dispose(): void {
    this.hide()
    this.container.remove()
  }
}