// WorksPlaneStage — real 3D case planes for the /works route.
//
// The DOM route remains the semantic and keyboard-accessible owner. Its card
// buttons are deliberately transparent hit targets/captions; this stage owns
// the visible project media, its TSL deformation and the plane-to-fullscreen
// handoff. Textures load only when /works is actually reached.

import * as THREE from 'three'
import { PROJECTS } from '../../Data/Projects'
import { prefersReducedMotion } from '../../core/motionPolicy'
import { CasePlane } from './CasePlane'

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

const WIDE_LAYOUT: readonly [CaseLayout, CaseLayout] = [
  { x: -0.74, y: -0.02, z: -3.05, scale: 2.18 },
  { x: 1.42, y: -0.42, z: -3.62, scale: 1.38 },
]
// UIkit's `@m` grid breakpoint is where the semantic card controls stack.
// Mirror that exact editorial order in the 3D layer instead of squeezing the
// desktop two-column coordinates into a narrow viewport.
const STACKED_LAYOUT: readonly [CaseLayout, CaseLayout] = [
  { x: -0.02, y: 0.64, z: -3.15, scale: 1.82 },
  { x: 0.12, y: -0.78, z: -3.52, scale: 1.46 },
]
const TRANSITION_DURATION = 1.15
const OVERLAY_TAKEOVER = 0.86
const CRT_TRIGGER = 0.42
const CASE_PLANE_HEIGHT = 9 / 16

interface OpeningState {
  card: CasePlane
  index: number
  time: number
  started: boolean
  crtTriggered: boolean
  reducedMotion: boolean
  openOverlay: (index: number) => void
  startPosition: THREE.Vector3
  startScale: number
  startRotation: THREE.Euler
}

export class WorksPlaneStage extends THREE.Group {
  private cards: CasePlane[] = []
  private _camera: THREE.Camera | null = null
  private _raycaster = new THREE.Raycaster()
  private _ndc = new THREE.Vector2()
  private _sectionIndex = 0
  private _active = false
  private _initialized = false
  private _stackedLayout = window.innerWidth < 960
  private _opening: OpeningState | null = null
  private _reveal = new Map<CasePlane, number>()
  private _tmpCameraPosition = new THREE.Vector3()
  private _tmpTargetPosition = new THREE.Vector3()
  private _tmpTargetRotation = new THREE.Euler()
  private _fullscreenScale = 1

  constructor() {
    super()
    this.name = 'works-plane-stage'
    this.visible = false
    this.renderOrder = 3
  }

  get isAnimating(): boolean {
    if (this._opening !== null) return true
    if (!this._active) return false

    const activeProjects = SECTION_PROJECTS[this._sectionIndex]!
    return this.cards.some((card) => {
      const projectIndex = card.userData.projectIndex as number
      const shouldBeVisible =
        activeProjects[0] === projectIndex || activeProjects[1] === projectIndex
      if (!shouldBeVisible) return false
      return card.isAnimating || (this._reveal.get(card) ?? 0) < 0.995
    })
  }

  async init(): Promise<void> {
    if (this._initialized) return
    this._initialized = true

    const loader = new THREE.TextureLoader()
    const textures = await Promise.all(
      PROJECTS.map(
        (project) =>
          new Promise<THREE.Texture>((resolve, reject) => {
            loader.load(
              project.textureUrl,
              (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace
                texture.minFilter = THREE.LinearMipmapLinearFilter
                texture.magFilter = THREE.LinearFilter
                resolve(texture)
              },
              undefined,
              reject,
            )
          }),
      ),
    )

    textures.forEach((texture, index) => {
      const plane = new CasePlane(texture)
      plane.userData.projectIndex = index
      plane.setReveal(0)
      this.cards.push(plane)
      this._reveal.set(plane, 0)
      this.add(plane)
    })
  }

  setCamera(camera: THREE.Camera): void {
    this._camera = camera
  }

  /**
   * The semantic UIkit grid becomes a two-row composition below `@m`; keep
   * the actual media planes in that same layout so captions, hit targets and
   * visual media continue to describe one object on mobile and tablet.
   */
  resize(width: number): void {
    this._stackedLayout = width < 960
  }

  setActive(active: boolean, sectionIndex: number): void {
    this._active = active
    this._sectionIndex = THREE.MathUtils.clamp(sectionIndex, 0, SECTION_PROJECTS.length - 1)
    this.visible = active || this._opening !== null
  }

  /** Start the real plane-to-fullscreen handoff. Returns false when no matching
   * current plane exists, allowing the DOM overlay fallback to remain safe. */
  openProject(index: number, openOverlay: (index: number) => void): boolean {
    if (!this._active || this._opening) return false
    const card = this.cards[index]
    if (!card || !card.visible) return false

    this._opening = {
      card,
      index,
      time: 0,
      started: false,
      crtTriggered: false,
      reducedMotion: prefersReducedMotion(),
      openOverlay,
      startPosition: card.position.clone(),
      startScale: card.scale.x,
      startRotation: card.rotation.clone(),
    }
    if (!this._opening.reducedMotion) card.pulse(0.42)
    return true
  }

  /** Pointer interaction for the visual plane itself, outside DOM hit targets. */
  handleTap(clientX: number, clientY: number, openOverlay: (index: number) => void): boolean {
    if (!this._camera || !this._active || this._opening) return false
    this._ndc.x = (clientX / window.innerWidth) * 2 - 1
    this._ndc.y = -(clientY / window.innerHeight) * 2 + 1
    this._raycaster.setFromCamera(this._ndc, this._camera)
    const hits = this._raycaster.intersectObjects(
      this.cards.filter((card) => card.visible),
      false,
    )
    const hit = hits[0]?.object as CasePlane | undefined
    if (!hit) return false
    return this.openProject(hit.userData.projectIndex as number, openOverlay)
  }

  /** Restore the route stage after UIkit closes the fullscreen detail. */
  resetTransition(): void {
    this._opening?.card.setTransition(0)
    this._opening = null
    this.visible = this._active
  }

  update(dt: number): void {
    if (!this._camera || (!this._active && !this._opening)) return

    // Keep the stage in camera-local space while remaining a child of World.
    // That produces actual parallax/depth but keeps its page composition stable
    // when story camera smoothing, FOV and cursor follow are active.
    this._camera.getWorldPosition(this._tmpCameraPosition)
    this.position.copy(this._tmpCameraPosition)
    this.quaternion.copy(this._camera.quaternion)
    const camera = this._camera as THREE.PerspectiveCamera
    if (camera.isPerspectiveCamera) {
      const fullscreenDistance = 0.92
      const frameHeight =
        2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * fullscreenDistance
      const frameWidth = frameHeight * camera.aspect
      this._fullscreenScale = Math.max(frameWidth, frameHeight / CASE_PLANE_HEIGHT) * 1.015
    }

    const activeProjects = SECTION_PROJECTS[this._sectionIndex]!
    const opening = this._opening

    this.cards.forEach((card) => {
      const projectIndex = card.userData.projectIndex as number
      const isPrimary = activeProjects[0] === projectIndex
      const isSecondary = activeProjects[1] === projectIndex
      const isVisible = isPrimary || isSecondary
      const targetReveal = opening && opening.card !== card ? 0 : isVisible ? 1 : 0
      const reveal = this._reveal.get(card) ?? 0
      const nextReveal = THREE.MathUtils.damp(reveal, targetReveal, 10, dt)
      this._reveal.set(card, nextReveal)

      if (opening?.card === card) return
      if (!isVisible && nextReveal < 0.002) {
        card.setReveal(0)
        return
      }

      const layouts = this._stackedLayout ? STACKED_LAYOUT : WIDE_LAYOUT
      const layout = isPrimary ? layouts[0] : layouts[1]
      this._tmpTargetPosition.set(layout.x, layout.y, layout.z)
      this._tmpTargetRotation.set(isSecondary ? -0.018 : 0.006, isSecondary ? -0.07 : 0.025, 0)
      card.position.lerp(this._tmpTargetPosition, 1 - Math.exp(-dt * 9))
      card.rotation.x += (this._tmpTargetRotation.x - card.rotation.x) * (1 - Math.exp(-dt * 9))
      card.rotation.y += (this._tmpTargetRotation.y - card.rotation.y) * (1 - Math.exp(-dt * 9))
      card.rotation.z += (this._tmpTargetRotation.z - card.rotation.z) * (1 - Math.exp(-dt * 9))
      const targetScale = layout.scale
      const nextScale = THREE.MathUtils.damp(card.scale.x, targetScale, 10, dt)
      card.scale.setScalar(nextScale)
      card.setReveal(nextReveal)
      card.setMotion(Math.max(0, 0.16 - nextReveal * 0.16), isSecondary ? -1 : 1)
      card.setParallax(isSecondary ? -0.42 : 0.18)
      card.setTransition(0)
      card.update(dt, this._active)
    })

    if (!opening) return

    opening.time = opening.reducedMotion ? 1 : Math.min(1, opening.time + dt / TRANSITION_DURATION)
    const t = opening.time
    const focus = THREE.MathUtils.smoothstep(t / 0.9, 0, 1)
    this._tmpTargetPosition.set(0, 0, -0.92)
    opening.card.position.lerpVectors(opening.startPosition, this._tmpTargetPosition, focus)
    opening.card.rotation.set(
      THREE.MathUtils.lerp(opening.startRotation.x, 0, focus),
      THREE.MathUtils.lerp(opening.startRotation.y, 0, focus),
      THREE.MathUtils.lerp(opening.startRotation.z, 0, focus),
    )
    opening.card.scale.setScalar(
      THREE.MathUtils.lerp(opening.startScale, this._fullscreenScale, focus),
    )
    opening.card.setReveal(1)
    opening.card.setMotion(0, 1)
    opening.card.setEdgeWarp(0)
    opening.card.setParallax(0)
    opening.card.setTransition(THREE.MathUtils.smoothstep(t, 0, 1))
    opening.card.update(dt, true)

    if (!opening.crtTriggered && t >= CRT_TRIGGER) {
      opening.crtTriggered = true
      if (!opening.reducedMotion) opening.card.triggerCrtOn()
    }

    // UIkit takes over only after the focus and most of the camera travel have
    // resolved, while the real plane still safely fills the view.
    if (!opening.started && t >= OVERLAY_TAKEOVER) {
      opening.started = true
      opening.openOverlay(opening.index)
    }
  }

  dispose(): void {
    const textures = new Set<THREE.Texture>()
    this.cards.forEach((card) => {
      const texture = card.texture
      if (texture && !textures.has(texture)) {
        textures.add(texture)
        texture.dispose()
      }
      card.dispose()
    })
    this.cards = []
    this._reveal.clear()
    this.clear()
  }
}
