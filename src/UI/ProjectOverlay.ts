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
    this.container.style.cssText = [
      'position: fixed',
      'bottom: 12vh',
      'left: 50%',
      'transform: translateX(-50%)',
      'text-align: center',
      'pointer-events: none',
      'z-index: 50',
      'transition: opacity 0.4s ease',
    ].join('; ') + '; x'
    this.buildContent()
    document.body.appendChild(this.container)
  }

  private buildContent(): void {
    const svg_prev = ['<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5">','<polyline points="15 18 9 12 15 6"/></svg>'].join('')
    const svg_next = ['<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5">','<polyline points="9 18 15 12 9 6"/></svg>'].join('')
    this.container.innerHTML = [
      '<div class="project-overlay__index" style="font-size: 0.75rem; letter-spacing: 0.25em; color: rgba(255,255,255,0.4); margin-bottom: 0.5rem;"></div>',
      '<div class="project-overlay__title" style="font-size: clamp(1.4rem, 4vw, 3rem); font-weight: 300; letter-spacing: 0.3em; color: rgba(255,255,255,0.9); margin: 0;"></div>',
      '<div class="project-overlay__category" style="font-size: 0.85rem; letter-spacing: 0.2em; color: rgba(255,255,255,0.35); margin-top: 0.4rem;"></div>',
      '<div class="project-overlay__nav" style="margin-top: 2rem; display: flex; justify-content: center; gap: 2rem;">',
        '<button class="prev" style="background:none;border:none;cursor:pointer;pointer-events: auto;">' + svg_prev + '</button>',
        '<span class="counter" style="color: rgba(255,255,255,0.4); font-size: 0.75rem; line-height: 24px;"></span>',
        '<button class="next" style="background:none;border:none;cursor:pointer;pointer-events: auto;">' + svg_next + '</button>',
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
    this.indexEl.textContent = ('0' + (index + 1)).slice(-2)
    this.titleEl.textContent = project.title.toUpperCase()
    this.catEl.textContent = project.category + ' \u00b7 ' + project.year
    this.counterEl.textContent = (index + 1) + ' / ' + total
    const accent = project.color.replace('#', '')
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