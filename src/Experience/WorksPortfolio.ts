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
    if (n === 0) return
    this.currentIdx = (((this.currentIdx + 1) % n) + n) % n
    this.onCardClick(this.currentIdx)
  }

  prev(): void {
    const n = this.projects.length
    if (n === 0) return
    this.currentIdx = (((this.currentIdx - 1) % n) + n) % n
    this.onCardClick(this.currentIdx)
  }

  goTo(idx: number): void {
    const n = this.projects.length
    if (n === 0) return
    this.currentIdx = ((Math.round(idx) % n) + n) % n
    this.onCardClick(this.currentIdx)
  }

  dispose(): void {
    this.projects = []
    this.currentIdx = 0
    this.onCardClick = () => undefined
  }
}

/** Factory function — used by Experience.ensurePortfolio() to construct
 *  the portfolio with a wired onCardClick callback. */
export function createWorksPortfolio(
  projects: Project[],
  onCardClick: (index: number) => void,
): WorksPortfolio {
  return new WorksPortfolio(projects, onCardClick)
}
