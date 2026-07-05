// WorksPortfolio — project metadata + texture container for the works section.
//
// This was originally a cube-face slider with spring physics, drag/wheel/keyboard
// input, and expand/collapse animations. That role is now fully handled by
// BakuCarousel (baku cube morphs into a carousel ring of cards). What remains
// here is the minimal surface still consumed by Experience:
//   - `projects`: Project[] metadata (used by onProjectSelect to populate the overlay)
//   - `textures` / `texturesLoaded` / `applyTexturesToCube`: legacy cube-face
//     texture application (still wired in the section-change handler for backward
//     compat, though BakuCarousel renders its own card textures on top)
//   - `prev()` / `next()`: thin wrappers that drive the BakuCarousel via the
//     onCardClick callback (DevPanel + ProjectOverlay arrows use these)
//   - `dispose()`: disposes loaded textures
//
// All input handlers, spring physics, drag, expand/collapse, and cube-rotation
// logic were removed — they fought with BakuCarousel and ran while invisible.

import * as THREE from 'three'
import { type Project } from '../core/types'

export class WorksPortfolio {
  public readonly group = new THREE.Group()
  private static readonly sharedLoader = new THREE.TextureLoader()
  public projects: Project[]
  public currentIdx = 0
  /** Public — Experience re-applies on works section entry. */
  textures: (THREE.Texture | null)[] = []
  /** Public — Experience checks load state. */
  texturesLoaded = false
  private baku: THREE.Object3D | null = null

  /** Callback fired when prev/next is invoked (Experience wires it to BakuCarousel). */
  public onCardClick: (index: number) => void = () => {}

  constructor(projects: Project[], onCardClick: (index: number) => void = () => {}) {
    this.group.name = 'works-portfolio'
    this.group.visible = false // never rendered — BakuCarousel owns the works UI
    this.projects = projects
    this.onCardClick = onCardClick
    this.textures = new Array(projects.length).fill(null)
  }

  /** Set the baku (SplashCube) that will display project textures on its faces. */
  setBaku(baku: THREE.Object3D): void {
    this.baku = baku
    this.loadAllTextures()
  }

  private loadAllTextures(): void {
    if (this.texturesLoaded || !this.baku) return
    this.texturesLoaded = true
    let loaded = 0
    for (let i = 0; i < this.projects.length; i++) {
      const url = this.projects[i]!.textureUrl || this.projects[i]!.detailTextureUrl
      if (!url) {
        loaded++
        continue
      }
      WorksPortfolio.sharedLoader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          this.textures[i] = tex
          loaded++
          if (loaded >= this.projects.length) {
            this.applyTexturesToCube()
          }
        },
        undefined,
        () => {
          loaded++
        },
      )
    }
  }

  /** Public — Experience calls this on works section entry. */
  applyTexturesToCube(): void {
    const cube = this.baku as unknown as {
      setProjectTextures?: (t: (THREE.Texture | null)[]) => void
    }
    cube?.setProjectTextures?.(this.textures)
  }

  /** No-op kept for API compat — camera ref no longer needed (no raycasting). */
  setCamera(_cam: THREE.Camera): void {}

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

  /** No-op kept for API compat — expand/collapse was removed. */
  expandCard(_idx: number): void {}
  collapseCard(): void {}

  dispose(): void {
    for (const tex of this.textures) {
      tex?.dispose()
    }
    this.textures = []
  }
}
