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
//
// All input handlers, spring physics, drag, expand/collapse, cube-rotation
// logic, texture-loading pipeline, and the never-rendered THREE.Group have
// been removed — they fought with BakuCarousel and ran while invisible.

import { type Project } from '../core/types'

export interface WorksPortfolio {
  projects: Project[]
  currentIdx: number
  onCardClick: (index: number) => void
  prev(): void
  next(): void
  goTo(idx: number): void
}

export function createWorksPortfolio(
  projects: Project[],
  onCardClick: (index: number) => void,
): WorksPortfolio {
  let currentIdx = 0
  return {
    projects,
    currentIdx,
    onCardClick,
    next() {
      const n = projects.length
      currentIdx = ((currentIdx + 1) % n + n) % n
      onCardClick(currentIdx)
    },
    prev() {
      const n = projects.length
      currentIdx = ((currentIdx - 1) % n + n) % n
      onCardClick(currentIdx)
    },
    goTo(idx: number) {
      const n = projects.length
      currentIdx = ((Math.round(idx) % n) + n) % n
      onCardClick(currentIdx)
    },
  }
}
