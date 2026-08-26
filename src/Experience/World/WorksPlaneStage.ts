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
import { observeReducedMotion, prefersReducedMotion } from '../../core/motionPolicy'
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
  private _reducedMotion = prefersReducedMotion()
  private _reducedMotionUnsub: (() => void) | null = null
  private _stackedLayout = window.innerWidth < 960
  private _viewportAspect = window.innerWidth / window.innerHeight
  private _reveal = new Map<CasePlane, number>()
  private _tmpCameraPosition = new THREE.Vector3()
  private _tmpTargetPosition = new THREE.Vector3()
  private _tmpTargetRotation = new THREE.Euler()
  // Keep one layout reconciliation after a state/camera change, then avoid
  // rewriting all route cards while another scene owner keeps demand frames
  // flowing through the shared renderer.
  private _layoutDirty = true
  private _lastCameraPosition = new THREE.Vector3(Number.NaN, Number.NaN, Number.NaN)
  private _lastCameraQuaternion = new THREE.Quaternion(
    Number.NaN,
    Number.NaN,
    Number.NaN,
    Number.NaN,
  )
  // Reused per-frame layout result; visible cards are laid out every frame and
  // must not allocate a fresh object for each viewport calculation.
  private _tmpScaledLayout: CaseLayout = { x: 0, y: 0, z: 0, scale: 0 }

  constructor() {
    super()
    this.name = 'works-plane-stage'
    this.visible = false
    this.renderOrder = 3
    this._reducedMotionUnsub = observeReducedMotion((reduced) => {
      this.setReducedMotion(reduced)
    })
  }

  /** Settle route-local reveals and card transforms at the owner boundary. */
  setReducedMotion(reduced: boolean): void {
    if (this._disposed) return
    this._reducedMotion = reduced
    this._layoutDirty = true
    this.cards.forEach((card) => card.setReducedMotion(reduced))
    if (!reduced) return

    const activeProjects = SECTION_PROJECTS[this._sectionIndex]!
    this.cards.forEach((card) => {
      const projectIndex = card.userData.projectIndex as number
      const targetReveal = activeProjects.some((project) => project === projectIndex) ? 1 : 0
      this._reveal.set(card, targetReveal)
      card.setReveal(targetReveal)
    })
    if (this._active && this._camera) this.update(0)
  }

  get isAnimating(): boolean {
    if (this._disposed || !this._active) return false

    const activeProjects = SECTION_PROJECTS[this._sectionIndex]!
    const cardsAnimating = this.cards.some((card) => {
      const projectIndex = card.userData.projectIndex as number
      const shouldBeVisible =
        activeProjects[0] === projectIndex || activeProjects[1] === projectIndex
      const reveal = this._reveal.get(card) ?? 0
      // Include departing cards and their cloth pulses: hidden cards still
      // need a few passes to settle their reveal/animation state before the
      // stage can take the settled fast path.
      return card.isAnimating || (shouldBeVisible ? reveal < 0.995 : reveal > 0.005)
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
      textures.forEach((texture, index) => releaseCaseTexture(PROJECTS[index]!.textureUrl, texture))
      this._initialized = false
      return
    }

    const stagedCards: CasePlane[] = []
    try {
      textures.forEach((texture, index) => {
        const plane = new CasePlane(texture)
        plane.setReducedMotion(this._reducedMotion)
        plane.userData.projectIndex = index
        plane.userData.texUrl = PROJECTS[index]!.textureUrl
        plane.setReveal(0)
        stagedCards.push(plane)
        this._reveal.set(plane, 0)
        this.add(plane)
      })
      this.cards = stagedCards
      this._layoutDirty = true
    } catch (error) {
      stagedCards.forEach((card) => {
        card.removeFromParent()
        card.dispose()
      })
      this._reveal.clear()
      textures.forEach((texture, index) => releaseCaseTexture(PROJECTS[index]!.textureUrl, texture))
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
    if (this._disposed) return Promise.resolve()
    return Promise.resolve()
  }

  setCamera(camera: THREE.Camera): void {
    if (this._disposed) return
    if (this._camera === camera) return
    this._camera = camera
    this._layoutDirty = true
  }

  /**
   * The semantic UIkit grid becomes a two-row composition below `@m`; keep
   * the actual media planes in that same layout so captions, hit targets and
   * visual media continue to describe one object on mobile and tablet.
   */
  resize(width: number, height: number): void {
    if (this._disposed) return
    this._stackedLayout = width < 960
    const aspect = width / height
    this._viewportAspect = aspect
    this._layoutDirty = true
  }

  setActive(active: boolean, sectionIndex: number): void {
    if (this._disposed) return
    const nextSection = THREE.MathUtils.clamp(sectionIndex, 0, SECTION_PROJECTS.length - 1)
    const changed = active !== this._active || nextSection !== this._sectionIndex
    this._active = active
    this._sectionIndex = nextSection
    this.visible = active
    if (changed) this._layoutDirty = true
  }

  /** Open project overlay with unified wobble pulse (same as BakuCarousel).
   *  Returns false when no matching plane exists. */
  openProject(index: number, openOverlay: (index: number) => void): boolean {
    if (this._disposed || !this._active) return false
    const card = this.cards[index]
    if (!card || !card.visible) return false

    // Unified cloth wobble pulse — identical to BakuCarousel.handleTap()
    card.pulse(CLOTH_PARAMS.pulseAmount)
    openOverlay(index)
    return true
  }

  /** Pointer interaction for the visual plane itself, outside DOM hit targets. */
  handleTap(clientX: number, clientY: number, openOverlay: (index: number) => void): boolean {
    if (this._disposed || !this._camera || !this._active) return false
    const idx = this.hitTest(clientX, clientY)
    if (idx < 0) return false
    return this.openProject(idx, openOverlay)
  }

  /** Raycast against visible planes. Returns the project index or -1 on miss. */
  hitTest(clientX: number, clientY: number): number {
    if (this._disposed || !this._camera || !this._active) return -1
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
    if (this._disposed || !this._camera || !this._active) return

    // Keep the stage in camera-local space while remaining a child of World.
    this._camera.getWorldPosition(this._tmpCameraPosition)
    const cameraChanged =
      !this._lastCameraPosition.equals(this._tmpCameraPosition) ||
      !this._lastCameraQuaternion.equals(this._camera.quaternion)
    const layoutDirty = this._layoutDirty || cameraChanged
    if (!layoutDirty && !this.isAnimating) return
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
      const nextReveal = this._reducedMotion
        ? targetReveal
        : THREE.MathUtils.damp(reveal, targetReveal, 10, dt)
      this._reveal.set(card, nextReveal)
      const revealChanged = Math.abs(nextReveal - reveal) >= 0.001

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
      if (this._reducedMotion) {
        card.position.set(scaledLayout.x, scaledLayout.y, scaledLayout.z)
        card.rotation.set(isSecondary ? -0.018 : 0.006, isSecondary ? -0.07 : 0.025, 0)
        card.scale.setScalar(scaledLayout.scale)
      } else if (reveal < 0.01 && targetReveal > 0.5) {
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
      // A visible card with no own cloth activity does not need its time
      // uniform advanced while a sibling is pulsing. Layout/reveal changes
      // remain explicit wake boundaries; card.isAnimating keeps its own
      // wobble/motion/edge decay progressing until it settles.
      card.update(dt, layoutDirty || revealChanged || card.isAnimating)
    })
    this._lastCameraPosition.copy(this._tmpCameraPosition)
    this._lastCameraQuaternion.copy(this._camera.quaternion)
    this._layoutDirty = false

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
    this._tmpScaledLayout.x = viewWidth * layout.x
    this._tmpScaledLayout.y = viewHeight * layout.y
    this._tmpScaledLayout.z = layout.z
    this._tmpScaledLayout.scale = this._stackedLayout
      ? Math.min(widthScale, heightScale)
      : widthScale
    return this._tmpScaledLayout
  }

  dispose(): void {
    if (this._disposed) return
    this._disposed = true
    this._reducedMotionUnsub?.()
    this._reducedMotionUnsub = null
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
