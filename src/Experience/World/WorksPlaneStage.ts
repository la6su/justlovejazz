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

// Layouts use fractions of the camera frustum. This lets the composition fill
// a 21:9 desktop and a portrait phone without treating a 16:9 mockup as a
// universal coordinate system.
const WIDE_LAYOUT: readonly [CaseLayout, CaseLayout] = [
  { x: -0.16, y: 0.03, z: -3.05, scale: 0.52 },
  { x: 0.27, y: -0.16, z: -3.62, scale: 0.32 },
]
// UIkit's `@m` grid breakpoint is where the semantic card controls stack.
// Mirror that exact editorial order in the 3D layer instead of squeezing the
// desktop two-column coordinates into a narrow viewport.
const STACKED_LAYOUT: readonly [CaseLayout, CaseLayout] = [
  { x: -0.03, y: 0.25, z: -3.15, scale: 0.68 },
  { x: 0.04, y: -0.25, z: -3.52, scale: 0.6 },
]
// Unified animation: tap → wobble pulse + direct overlay open (same as BakuCarousel).
// No 3D plane-to-fullscreen transition — the CSS clip-path iris reveal handles it.

export class WorksPlaneStage extends THREE.Group {
  private cards: CasePlane[] = []
  private _camera: THREE.Camera | null = null
  private _raycaster = new THREE.Raycaster()
  private _ndc = new THREE.Vector2()
  private _sectionIndex = 0
  private _active = false
  private _initialized = false
  private _disposed = false
  private _stackedLayout = window.innerWidth < 960
  private _viewportAspect = window.innerWidth / window.innerHeight
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
    return cardsAnimating
  }

  async init(): Promise<void> {
    if (this._initialized || this._disposed) return
    this._initialized = true

    let textures: THREE.Texture[]
    let initFailed = false
    const acquiredTextures = new Map<string, THREE.Texture>()
    try {
      textures = await Promise.all(
        PROJECTS.map((project) =>
          loadCaseTexture(project.textureUrl).then((texture) => {
            if (initFailed) releaseCaseTexture(project.textureUrl, texture)
            else acquiredTextures.set(project.textureUrl, texture)
            return texture
          }),
        ),
      )
    } catch (error) {
      initFailed = true
      acquiredTextures.forEach((texture, url) => releaseCaseTexture(url, texture))
      this._initialized = false
      throw error
    }

    if (this._disposed) {
      textures.forEach((texture, index) =>
        releaseCaseTexture(PROJECTS[index]!.textureUrl, texture),
      )
      this._initialized = false
      return
    }

    const stagedCards: CasePlane[] = []
    try {
      textures.forEach((texture, index) => {
        const plane = new CasePlane(texture)
        plane.userData.projectIndex = index
        plane.userData.texUrl = PROJECTS[index]!.textureUrl
        plane.setReveal(0)
        stagedCards.push(plane)
        this._reveal.set(plane, 0)
        this.add(plane)
      })
      this.cards = stagedCards
    } catch (error) {
      stagedCards.forEach((card) => {
        card.removeFromParent()
        card.dispose()
      })
      this._reveal.clear()
      textures.forEach((texture, index) =>
        releaseCaseTexture(PROJECTS[index]!.textureUrl, texture),
      )
      this._initialized = false
      throw error
    }
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
   */
  resize(width: number, height: number): void {
    this._stackedLayout = width < 960
    const aspect = width / height
    this._viewportAspect = aspect
  }

  setActive(active: boolean, sectionIndex: number): void {
    const nextSection = THREE.MathUtils.clamp(sectionIndex, 0, SECTION_PROJECTS.length - 1)
    this._active = active
    this._sectionIndex = nextSection
    this.visible = active
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
      const scaledLayout = this.layoutInView(layout)

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

    // The text has its own delayed wipe: it is intentionally independent of card opacity.
  }

  private layoutInView(layout: CaseLayout): CaseLayout {
    if (!(this._camera instanceof THREE.PerspectiveCamera)) return layout

    const distance = Math.abs(layout.z)
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this._camera.fov) / 2) * distance
    const viewWidth = viewHeight * this._viewportAspect
    const widthScale = viewWidth * layout.scale
    // Portrait cards stay width-led with a deliberate gutter; the semantic
    // UIkit grid uses the same stacked rhythm below the medium breakpoint.
    const heightScale = (viewHeight * layout.scale) / (9 / 16)
    return {
      x: viewWidth * layout.x,
      y: viewHeight * layout.y,
      z: layout.z,
      scale: this._stackedLayout ? Math.min(widthScale, heightScale) : widthScale,
    }
  }

  dispose(): void {
    if (this._disposed) return
    this._disposed = true
    this._active = false
    this._camera = null
    this.cards.forEach((card) => {
      const url = card.userData.texUrl as string | undefined
      if (url) releaseCaseTexture(url, card.texture ?? undefined)
      card.dispose()
    })
    this.cards = []
    this._reveal.clear()
    this.clear()
  }
}
