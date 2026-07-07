// WorksPortfolio — project metadata container for the works section.
//
// This was originally a cube-face slider with spring physics, drag/wheel/keyboard
// input, expand/collapse animations, and a texture-loading pipeline that pushed
// per-face textures onto the baku cube. That entire role is now handled by
// BakuCarousel (baku cube morphs into a carousel ring of cards with its own
// per-card textures). What remains here is the minimal surface still consumed
// by Experience:
//   - `projects`: Project[] metadata (used by onProjectSelect to populate the overlay)
//   - `currentIdx`: tracks which project is active
//   - `onCardClick`: callback Experience wires to BakuCarousel
//   - `prev()` / `next()` / `goTo()`: drive BakuCarousel via onCardClick
//     (DevPanel + ProjectOverlay arrows use these)
//   - `dispose()`: clears the (never-rendered) group
//
// All input handlers, spring physics, drag, expand/collapse, cube-rotation
// logic, and texture-loading pipeline were removed — they fought with
// BakuCarousel and ran while invisible.

import * as THREE from 'three'
import { type Project } from '../core/types'

export class WorksPortfolio {
  public readonly group = new THREE.Group()
  public projects: Project[]
  public currentIdx = 0

  /** Callback fired when prev/next is invoked (Experience wires it to BakuCarousel). */
  public onCardClick: (index: number) => void

  constructor(projects: Project[], onCardClick: (index: number) => void) {
    this.group.name = 'works-portfolio'
    this.group.visible = false // never rendered — BakuCarousel owns the works UI
    this.projects = projects
    this.onCardClick = onCardClick
  }

  /** Advance to next project (drives BakuCarousel via onCardClick). */
  next(): void {
    const n = this.projects.length
    this.currentIdx = ((this.currentIdx + 1) % n + n) % n
    this.onCardClick(this.currentIdx)
  }

  /** Advance to previous project (drives BakuCarousel via onCardClick). */
  prev(): void {
    const n = this.projects.length
    this.currentIdx = ((this.currentIdx - 1) % n + n) % n
    this.onCardClick(this.currentIdx)
  }

  /** Jump to a specific project index (drives BakuCarousel via onCardClick). */
  goTo(idx: number): void {
    const n = this.projects.length
    this.currentIdx = ((Math.round(idx) % n) + n) % n
    this.onCardClick(this.currentIdx)
  }

  dispose(): void {
    this.group.clear()
  }
}
