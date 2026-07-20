// WorksPortfolio — project metadata container for the works section.
//
// Tracks the active project index and delegates navigation to BakuCarousel
// via the onCardClick callback. Experience wires this to BakuCarousel.

import { type Project } from '../core/types'

export class WorksPortfolio {
  public projects: Project[]
  public currentIdx = 0

  /** Callback fired when prev/next/goTo is invoked (Experience wires it to BakuCarousel). */
  public onCardClick: (index: number) => void

  constructor(projects: Project[], onCardClick: (index: number) => void) {
    this.projects = projects
    this.onCardClick = onCardClick
  }

  next(): void {
    const n = this.projects.length
    this.currentIdx = ((this.currentIdx + 1) % n + n) % n
    this.onCardClick(this.currentIdx)
  }

  prev(): void {
    const n = this.projects.length
    this.currentIdx = ((this.currentIdx - 1) % n + n) % n
    this.onCardClick(this.currentIdx)
  }

  goTo(idx: number): void {
    const n = this.projects.length
    this.currentIdx = ((Math.round(idx) % n) + n) % n
    this.onCardClick(this.currentIdx)
  }

  dispose(): void {
    // No GPU resources to clean up
  }
}