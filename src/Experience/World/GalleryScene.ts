
import * as THREE from 'three'
import { GalleryManager } from '../../core/GalleryManager'
import { ProjectMaterial } from '../../shaders/ProjectMaterial'
import { AssetManager } from '../../core/AssetManager'
import { NarrativePhase, type WorldState } from '../../core/types'
import { Easings } from '../../Utils/Easings'
import type { Sizes } from '../../Experience/Sizes'

export class GalleryScene {
    public group = new THREE.Group()
    public planes: THREE.Mesh[] = []
    public materials: ProjectMaterial[] = []
    private raycaster = new THREE.Raycaster()
    private mouse = new THREE.Vector2()

    constructor(private manager: GalleryManager, private sizes: Sizes) {
        // Init called from Bootstrapper
    }

    public async init() {
        const assetManager = AssetManager.getInstance()

        const projectData = this.manager.projects.map(async (proj, i) => {
            const [tex, detTex] = await Promise.all([
                assetManager.loadTexture(proj.textureUrl),
                assetManager.loadTexture(proj.detailTextureUrl)
            ])

            const mat = new ProjectMaterial(tex, detTex, proj.color)
            const geometry = new THREE.PlaneGeometry(1, 1.4)
            const mesh = new THREE.Mesh(geometry, mat.material)
            mesh.userData = { projectId: proj.id, index: i }

            return { mat, mesh }
        })

        const results = await Promise.all(projectData)
        results.forEach(({ mat, mesh }) => {
            this.materials.push(mat)
            this.planes.push(mesh)
            this.group.add(mesh)
        })
    }

    public handlePointerDown(clientX: number, clientY: number, camera: THREE.Camera) {
        this.mouse.x = (clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(clientY / window.innerHeight) * 2 + 1

        this.raycaster.setFromCamera(this.mouse, camera)
        const intersects = this.raycaster.intersectObjects(this.planes)

        if (intersects.length > 0) {
            const obj = intersects[0].object as THREE.Mesh
            const index = obj.userData.index

            this.manager.transitionStartPos.copy(obj.position)
            this.manager.transitionStartScale = obj.scale.x

            this.manager.activeIndex = index
            this.manager.startFullscreen()
        }
    }

    update(worldState: WorldState) {
        if (worldState.currentPhase !== NarrativePhase.DEEP_DIVE) {
            this.group.visible = false
            return
        }

        this.group.visible = true

        const rawProgress = this.manager.transitionProgress
        const easeProgress = Easings.easeInOutQuart(rawProgress)
        const activeIndex = this.manager.activeIndex
        const isMobile = this.sizes.isMobile
        const clampProgress = this.manager.trackLength
        const half = clampProgress / 2

        this.planes.forEach((mesh, i) => {
            // ── Active project during transition ──
            if (i === activeIndex && rawProgress > 0) {
                mesh.position.lerpVectors(
                    this.manager.transitionStartPos,
                    new THREE.Vector3(0, 0, 1),
                    easeProgress
                )
                const scale = THREE.MathUtils.lerp(this.manager.transitionStartScale, 15, easeProgress)
                mesh.scale.setScalar(scale)
                mesh.visible = true

                // Only active project gets shader progress
                this.materials[i].setActive(true)
                this.materials[i].setProgress(rawProgress)
                return
            }

            // ── Inactive planes — carousel layout ──
            const pos = (i * this.manager.STEP) - this.manager.scrollX

            // Wrap around for infinite carousel
            let wrapped = pos % clampProgress
            if (wrapped < -half) wrapped += clampProgress
            if (wrapped > half) wrapped -= clampProgress

            if (isMobile) {
                const ry = wrapped / this.manager.STEP

                if (Math.abs(ry) <= 1.5) {
                    mesh.position.set(0, ry * 2.5, Math.abs(ry) < 0.5 ? 0 : -1)
                    mesh.scale.setScalar(0.7)
                    mesh.visible = true
                } else {
                    mesh.visible = false
                }
            } else {
                const rx = wrapped / this.manager.STEP

                if (Math.abs(rx) <= 1.5) {
                    mesh.position.set(rx * 2.2, 0, Math.abs(rx) < 0.5 ? 0 : -1)
                    mesh.scale.setScalar(0.8)
                    mesh.visible = true
                } else {
                    mesh.visible = false
                }
            }

            // Reset inactive shader state
            this.materials[i].setActive(false)
            this.materials[i].setProgress(0)
        })
    }

    dispose() {
        this.materials.forEach(m => m.dispose())
        this.planes.forEach(mesh => {
            mesh.geometry.dispose()
            mesh.parent?.remove(mesh)
        })
    }
}
