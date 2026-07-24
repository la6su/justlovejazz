// WorksPlaneStage — real 3D case planes for the /works route.
//
// The DOM route remains the semantic and keyboard-accessible owner. Its card
// buttons are deliberately transparent hit targets/captions; this stage owns
// the visible project media, its TSL deformation and the plane-to-fullscreen
// handoff. Textures load only when /works is actually reached.

import * as THREE from 'three'
import { PROJECTS } from '../../Data/Projects'
import { CasePlane, CLOTH_PARAMS } from './CasePlane'
import { loadCaseTexture, releaseCaseTexture } from './caseTexture'
import { WorksTextScreen } from './WorksTextScreen'
import type { RenderSurface } from '../Renderer'

const SECTION_PROJECTS = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
] as const

interface CaseLayout {
  x: number
  y: number
  z: number
  scale: number
}

// Layouts are designed for a 16:9 viewport. The `scale` factor is multiplied
// by an aspect-ratio correction at runtime so cards fill the screen width
// on both wide (21:9) and narrow (4:3) viewports without distortion.
const WIDE_LAYOUT: readonly [CaseLayout, CaseLayout] = [
  { x: -0.85, y: -0.02, z: -3.05, scale: 2.4 },
  { x: 1.65, y: -0.42, z: -3.62, scale: 1.5 },
]
// UIkit's `@m` grid breakpoint is where the semantic card controls stack.
// Mirror that exact editorial order in the 3D layer instead of squeezing the
// desktop two-column coordinates into a narrow viewport.
const STACKED_LAYOUT: readonly [CaseLayout, CaseLayout] = [
  { x: -0.02, y: 0.7, z: -3.15, scale: 2.0 },
  { x: 0.12, y: -0.85, z: -3.52, scale: 1.6 },
]
// Unified animation: tap → wobble pulse + direct overlay open (same as BakuCarousel).
// No 3D plane-to-fullscreen transition — the CSS clip-path iris reveal handles it.

export class WorksPlaneStage extends THREE.Group {
  private cards: CasePlane[] = []
  private textScreen: WorksTextScreen | null = null
  private _camera: THREE.Camera | null = null
  private _raycaster = new THREE.Raycaster()
  private _ndc = new THREE.Vector2()
  private _sectionIndex = 0
  private _active = false
  private _initialized = false
  private _stackedLayout = window.innerWidth < 960
  private _aspectScale = 1.0 // multiplier for card scale based on viewport aspect
  private _reveal = new Map<CasePlane, number>()
  private _tmpCameraPosition = new THREE.Vector3()
  private _tmpTargetPosition = new THREE.Vector3()
  private _tmpTargetRotation = new THREE.Euler()

  constructor() {
    super()
    this.name = 'works-plane-stage'
    this.visible = false
    this.renderOrder = 3
  }

  get isAnimating(): boolean {
    if (!this._active) return false

    const activeProjects = SECTION_PROJECTS[this._sectionIndex]!
    const cardsAnimating = this.cards.some((card) => {
      const projectIndex = card.userData.projectIndex as number
      const shouldBeVisible =
        activeProjects[0] === projectIndex || activeProjects[1] === projectIndex
      if (!shouldBeVisible) return false
      return card.isAnimating || (this._reveal.get(card) ?? 0) < 0.995
    })
    return cardsAnimating || (this.textScreen?.isAnimating ?? false)
  }

  async init(): Promise<void> {
    if (this._initialized) return
    this._initialized = true

    const textures = await Promise.all(
      PROJECTS.map((project) => loadCaseTexture(project.textureUrl)),
    )

    textures.forEach((texture, index) => {
      const plane = new CasePlane(texture)
      plane.userData.projectIndex = index
      plane.userData.texUrl = PROJECTS[index]!.textureUrl
      plane.setReveal(0)
      this.cards.push(plane)
      this._reveal.set(plane, 0)
      this.add(plane)
    })

    // Back-text screen behind the work cards — flat plane with scrolling
    // text texture and vertical wipe reveal (junni BackText pattern).
    this.textScreen = new WorksTextScreen()
    this.textScreen.position.set(0, 0, -6) // behind the cards (cards at z≈-3)
    this.textScreen.setReveal(0)
    this.add(this.textScreen)
  }

  /**
   * Shader pre-warm (inspired by the Ridgeline article).
   *
   * Currently a no-op: WebGPURenderer.compileAsync throws synchronously
   * during TSL node build because it needs a render-context camera stack
   * that isn't set up outside of a render call. Even with try/catch, the
   * partial node build can corrupt the CasePlane material state, making
   * textures invisible on /works.
   *
   * The WebGPURenderer compiles shaders lazily during the first actual
   * render (which has a proper render context), so pre-warming is not
   * needed. The first visible frame may have a slight jank while the TSL
   * nodes build, but the scene renders correctly.
   *
   * Re-enable only after upgrading to a Three.js version that fixes
   * compileAsync on the WebGPU backend, or after switching to a
   * WebGL2-only renderer that supports KHR_parallel_shader_compile.
   */
  prewarmShaders(_renderer: RenderSurface): Promise<void> {
    return Promise.resolve()
  }

  setCamera(camera: THREE.Camera): void {
    this._camera = camera
  }

  /**
   * The semantic UIkit grid becomes a two-row composition below `@m`; keep
   * the actual media planes in that same layout so captions, hit targets and
   * visual media continue to describe one object on mobile and tablet.
   *
   * Also computes an aspect-ratio scale factor so 3D cards fill the viewport
   * width on both wide (21:9 ultrawide) and narrow (4:3) screens without
   * distortion. The factor is centered on 16:9 (scale=1.0).
   */
  resize(width: number): void {
    this._stackedLayout = width < 960
    const height = window.innerHeight
    const aspect = width / height
    // 16:9 = 1.78 → scale 1.0. Wider screens get larger cards, narrower get smaller.
    // Clamp to [0.7, 1.4] so cards don't get absurdly large/tiny.
    this._aspectScale = THREE.MathUtils.clamp(aspect / 1.78, 0.7, 1.4)
    // Scale the text screen to match the viewport width.
    if (this.textScreen) {
      const screenAspect = width / height
      const screenW = THREE.MathUtils.clamp(screenAspect * 4, 10, 24)
      this.textScreen.scale.x = screenW / 16
      this.textScreen.scale.y = THREE.MathUtils.clamp(screenW / 16 * 0.8, 0.6, 1.4)
    }
  }

  setActive(active: boolean, sectionIndex: number): void {
    this._active = active
    this._sectionIndex = THREE.MathUtils.clamp(sectionIndex, 0, SECTION_PROJECTS.length - 1)
    this.visible = active
    // Sync the back-text screen to the active section + visibility state.
    // Full reveal (1.0) — the vertical wipe expands from center to edges,
    // matching the junni BackText pattern.
    if (this.textScreen) {
      this.textScreen.setSection(this._sectionIndex)
      this.textScreen.setReveal(active ? 1.0 : 0)
    }
  }

  /** Set theme polarity — flips text screen color for contrast. */
  setTheme(isLight: boolean): void {
    this.textScreen?.setTheme(isLight)
  }

  /** Re-render the text screen with the current i18n language. */
  refreshLanguage(): void {
    this.textScreen?.refreshLanguage()
  }

  /** Open project overlay with unified wobble pulse (same as BakuCarousel).
   *  Returns false when no matching plane exists. */
  openProject(index: number, openOverlay: (index: number) => void): boolean {
    if (!this._active) return false
    const card = this.cards[index]
    if (!card || !card.visible) return false

    // Unified cloth wobble pulse — identical to BakuCarousel.handleTap()
    card.pulse(CLOTH_PARAMS.pulseAmount)
    openOverlay(index)
    return true
  }

  /** Pointer interaction for the visual plane itself, outside DOM hit targets. */
  handleTap(clientX: number, clientY: number, openOverlay: (index: number) => void): boolean {
    if (!this._camera || !this._active) return false
    const idx = this.hitTest(clientX, clientY)
    if (idx < 0) return false
    return this.openProject(idx, openOverlay)
  }

  /** Raycast against visible planes. Returns the project index or -1 on miss. */
  hitTest(clientX: number, clientY: number): number {
    if (!this._camera || !this._active) return -1
    this._ndc.x = (clientX / window.innerWidth) * 2 - 1
    this._ndc.y = -(clientY / window.innerHeight) * 2 + 1
    this._raycaster.setFromCamera(this._ndc, this._camera)
    const hits = this._raycaster.intersectObjects(
      this.cards.filter((card) => card.visible),
      false,
    )
    const hit = hits[0]?.object as CasePlane | undefined
    if (!hit) return -1
    return hit.userData.projectIndex as number
  }

  update(dt: number): void {
    if (!this._camera || !this._active) return

    // Keep the stage in camera-local space while remaining a child of World.
    this._camera.getWorldPosition(this._tmpCameraPosition)
    this.position.copy(this._tmpCameraPosition)
    this.quaternion.copy(this._camera.quaternion)

    const activeProjects = SECTION_PROJECTS[this._sectionIndex]!
    this.cards.forEach((card) => {
      const projectIndex = card.userData.projectIndex as number
      const isPrimary = activeProjects[0] === projectIndex
      const isSecondary = activeProjects[1] === projectIndex
      const isVisible = isPrimary || isSecondary
      const targetReveal = isVisible ? 1 : 0
      const reveal = this._reveal.get(card) ?? 0
      const nextReveal = THREE.MathUtils.damp(reveal, targetReveal, 10, dt)
      this._reveal.set(card, nextReveal)

      // Cards that are not part of the active section fade out IN PLACE —
      // do not move them toward any layout slot, otherwise old cards slide
      // into the new secondary position and overlap the incoming card.
      if (!isVisible) {
        if (nextReveal < 0.002) {
          card.setReveal(0)
        } else {
          card.setReveal(nextReveal)
          card.update(dt, false)
        }
        return
      }

      const layouts = this._stackedLayout ? STACKED_LAYOUT : WIDE_LAYOUT
      const layout = isPrimary ? layouts[0] : layouts[1]
      // Apply aspect-ratio scale so cards fill the viewport width on any screen.
      const scaledLayout: CaseLayout = {
        x: layout.x * this._aspectScale,
        y: layout.y,
        z: layout.z,
        scale: layout.scale * this._aspectScale,
      }

      // Snap cards to their layout target on first appearance (reveal was 0)
      // so they never fly out from the camera-local origin.
      if (reveal < 0.01 && targetReveal > 0.5) {
        card.position.set(scaledLayout.x, scaledLayout.y, scaledLayout.z)
        card.rotation.set(isSecondary ? -0.018 : 0.006, isSecondary ? -0.07 : 0.025, 0)
        card.scale.setScalar(scaledLayout.scale)
      } else {
        this._tmpTargetPosition.set(scaledLayout.x, scaledLayout.y, scaledLayout.z)
        this._tmpTargetRotation.set(isSecondary ? -0.018 : 0.006, isSecondary ? -0.07 : 0.025, 0)
        card.position.lerp(this._tmpTargetPosition, 1 - Math.exp(-dt * 9))
        card.rotation.x += (this._tmpTargetRotation.x - card.rotation.x) * (1 - Math.exp(-dt * 9))
        card.rotation.y += (this._tmpTargetRotation.y - card.rotation.y) * (1 - Math.exp(-dt * 9))
        card.rotation.z += (this._tmpTargetRotation.z - card.rotation.z) * (1 - Math.exp(-dt * 9))
        const nextScale = THREE.MathUtils.damp(card.scale.x, scaledLayout.scale, 10, dt)
        card.scale.setScalar(nextScale)
      }
      card.setReveal(nextReveal)
      card.setMotion(0, 0)
      card.setTransition(0)
      card.update(dt, this._active)
    })

    // Update the back-text screen — keeps its visibility + time uniform in sync.
    this.textScreen?.update(dt)
  }

  dispose(): void {
    this.cards.forEach((card) => {
      const url = card.userData.texUrl as string | undefined
      if (url) releaseCaseTexture(url)
      card.dispose()
    })
    this.cards = []
    this._reveal.clear()
    this.textScreen?.dispose()
    this.textScreen = null
    this.clear()
  }
}
