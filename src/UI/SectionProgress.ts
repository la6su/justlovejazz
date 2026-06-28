// SectionProgress — Scroll progress indicator + section timeline navigation.
// Junni pattern: Footer timeline (clickable section nav) + Loading progress.
// DOM-based, synced with 3D scroll via input.getSmoothedScrollProgress().

import { input } from '../Experience/Input'

export class SectionProgress {
  private container: HTMLElement
  private bar: HTMLElement
  private dots: HTMLElement[] = []
  private sectionLabels: string[]
  private scrollHandler: () => void

  constructor(sectionLabels: string[]) {
    this.sectionLabels = sectionLabels
    this.container = document.createElement('div')
    this.container.className = 'jlz-section-progress'
    this.bar = document.createElement('div')
    this.bar.className = 'jlz-section-progress__bar'
    this.container.appendChild(this.bar)

    // Section dots (clickable navigation)
    const dotsWrap = document.createElement('div')
    dotsWrap.className = 'jlz-section-progress__dots'
    sectionLabels.forEach((label, i) => {
      const dot = document.createElement('button')
      dot.className = 'jlz-section-progress__dot'
      dot.setAttribute('aria-label', `Go to section ${i + 1}: ${label}`)
      dot.dataset.section = String(i)
      dot.addEventListener('click', () => {
        // Scroll to section: each section is 1/total of the page.
        const target = i / sectionLabels.length
        const scrollEl = document.documentElement
        const maxScroll = scrollEl.scrollHeight - window.innerHeight
        window.scrollTo({ top: maxScroll * target, behavior: 'smooth' })
      })
      dotsWrap.appendChild(dot)
      this.dots.push(dot)
    })
    this.container.appendChild(dotsWrap)
    document.body.appendChild(this.container)

    // Update on scroll.
    this.scrollHandler = () => this.update()
    window.addEventListener('scroll', this.scrollHandler, { passive: true })
    this.update()
  }

  private update(): void {
    const progress = input.getSmoothedScrollProgress()
    this.bar.style.transform = `scaleX(${progress})`

    // Highlight active section dot.
    const activeIdx = Math.min(
      Math.floor(progress * this.sectionLabels.length),
      this.sectionLabels.length - 1,
    )
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === activeIdx)
      dot.classList.toggle('is-passed', i < activeIdx)
    })
  }

  dispose(): void {
    window.removeEventListener('scroll', this.scrollHandler)
    this.container.remove()
  }
}
