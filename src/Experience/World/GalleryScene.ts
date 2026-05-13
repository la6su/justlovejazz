import * as THREE from 'three'
import { GalleryManager, GalleryTransitionState } from '../../core/GalleryManager'
import { ProjectMaterial } from '../../shaders/ProjectMaterial'
import { ProjectMaterialWebGL } from '../../shaders/ProjectMaterialWebGL'
import type { IGalleryCardSurface } from '../../shaders/GalleryCardSurface'
import { AssetManager } from '../../core/AssetManager'
import { DeviceCapability } from '../../core/DeviceCapability'
import { getSharedPlaceholderTexture } from '../../core/placeholderTexture'
import { Easings } from '../../Utils/Easings'
import type { Sizes } from '../../Experience/Sizes'

export class GalleryScene {
  public group = new THREE.Group()
  public planes: THREE.Mesh[] = []
  public surfaces: IGalleryCardSurface[] = []
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()

  private sizes: Sizes
  private readonly useWebGpu: boolean
  private readonly placeholder: THREE.DataTexture
  private textureReady: boolean[] = []
  private textureLoads = new Map<number, Promise<void>>()

  constructor(
    private manager: GalleryManager,
    sizes: Sizes,
  ) {
    this.sizes = sizes
    this.useWebGpu = DeviceCapability.getInstance().mode === 'webgpu'
    this.placeholder = getSharedPlaceholderTexture()
  }

  public async init() {
    const n = this.manager.projects.length
    this.textureReady = new Array(n).fill(false)

    for (let i = 0; i < n; i++) {
      const proj = this.manager.projects[i]
      const geometry = new THREE.PlaneGeometry(1, 1.4)

      const surface: IGalleryCardSurface = this.useWebGpu
        ? new ProjectMaterial(this.placeholder, this.placeholder, proj.color)
        : new ProjectMaterialWebGL(this.placeholder, proj.color)

      const mesh = new THREE.Mesh(geometry, surface.material)
      mesh.userData = { projectId: proj.id, index: i }
      this.surfaces.push(surface)
      this.planes.push(mesh)
      this.group.add(mesh)
    }
  }

  /** Phase F.2 — load real textures when a card enters the visible carousel window. */
  private scheduleTextureLoad(index: number) {
    void this.loadTexturesForIndex(index)
  }

  private async loadTexturesForIndex(index: number): Promise<void> {
    if (this.textureReady[index]) return
    const pending = this.textureLoads.get(index)
    if (pending) return pending

    const work = (async () => {
      const proj = this.manager.projects[index]
      const assetManager = AssetManager.getInstance()
      const [tex, det] = await Promise.all([
        assetManager.loadTexture(proj.textureUrl),
        assetManager.loadTexture(proj.detailTextureUrl),
      ])

      const mesh = this.planes[index]
      this.surfaces[index].dispose()

      if (this.useWebGpu) {
        this.surfaces[index] = new ProjectMaterial(tex, det, proj.color)
      } else {
        this.surfaces[index] = new ProjectMaterialWebGL(tex, proj.color)
      }
      mesh.material = this.surfaces[index].material
      this.textureReady[index] = true
    })()

    this.textureLoads.set(index, work)
    try {
      await work
    } finally {
      this.textureLoads.delete(index)
    }
  }

  public async ensureCardTextures(index: number): Promise<void> {
    await this.loadTexturesForIndex(index)
  }

  public async handlePointerDown(clientX: number, clientY: number, camera: THREE.Camera) {
    if (this.manager.isTransitioning) return

    this.mouse.x = (clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(clientY / window.innerHeight) * 2 + 1
    this.raycaster.setFromCamera(this.mouse, camera)
    const intersects = this.raycaster.intersectObjects(this.planes)

    if (intersects.length > 0) {
      const obj = intersects[0].object as THREE.Mesh
      const index = obj.userData.index as number
      await this.ensureCardTextures(index)
      const startPos = obj.position.clone()
      const startScale = obj.scale.x
      this.manager.expandCard(index, startPos, startScale)
    }
  }

  update(_dt: number) {
    const state = this.manager.transitionState
    const progress = this.manager.transitionProgress
    const activeIndex = this.manager.activeIndex

    const e = Easings.easeInOutQuart(progress)
    const isMobile = this.sizes.isMobile
    const trackLen = this.manager.trackLength
    const half = trackLen / 2

    this.planes.forEach((mesh, i) => {
      if (state === GalleryTransitionState.EXPAND && i === activeIndex) {
        mesh.position.lerpVectors(
          this.manager.transitionStartPos,
          new THREE.Vector3(0, 0, 1),
          e,
        )
        const scale = THREE.MathUtils.lerp(this.manager.transitionStartScale, 15, e)
        mesh.scale.setScalar(scale)
        mesh.visible = true
        this.surfaces[i].setProgress(progress)
        void this.ensureCardTextures(i)
        return
      }

      if (state === GalleryTransitionState.CONTRACT && i === activeIndex) {
        mesh.position.lerpVectors(
          new THREE.Vector3(0, 0, 1),
          this.manager.transitionStartPos,
          1 - e,
        )
        const scale = THREE.MathUtils.lerp(15, this.manager.transitionStartScale, 1 - e)
        mesh.scale.setScalar(scale)
        mesh.visible = true
        this.surfaces[i].setProgress(progress)
        return
      }

      this.surfaces[i].setProgress(0)
      const pos = i * this.manager.STEP - this.manager.scrollX
      let wrapped = pos % trackLen
      if (wrapped < -half) wrapped += trackLen
      if (wrapped > half) wrapped -= trackLen

      if (isMobile) {
        const ry = wrapped / this.manager.STEP
        if (Math.abs(ry) <= 1.5) {
          mesh.position.set(0, ry * 2.5, Math.abs(ry) < 0.5 ? 0 : -1)
          mesh.scale.setScalar(0.7)
          mesh.visible = true
          this.scheduleTextureLoad(i)
        } else {
          mesh.visible = false
        }
      } else {
        const rx = wrapped / this.manager.STEP
        if (Math.abs(rx) <= 1.5) {
          mesh.position.set(rx * 2.2, 0, Math.abs(rx) < 0.5 ? 0 : -1)
          mesh.scale.setScalar(0.8)
          mesh.visible = true
          this.scheduleTextureLoad(i)
        } else {
          mesh.visible = false
        }
      }
    })
  }

  dispose() {
    this.surfaces.forEach((s) => s.dispose())
    this.planes.forEach((mesh) => {
      mesh.geometry.dispose()
      mesh.parent?.remove(mesh)
    })
  }
}
