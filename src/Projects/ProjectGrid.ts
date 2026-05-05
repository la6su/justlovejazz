// src/Projects/ProjectGrid.ts
import * as THREE from 'three'
import { PROJECTS } from '../Data/Projects'
import { UIManager } from '../UI/UIManager'
import { ProjectGallery } from '../UI/ProjectGallery'
import { uniform, uv, vec2, vec3, distance, texture, add, sub, mul } from 'three/tsl'
import { MeshStandardNodeMaterial } from 'three/webgpu'

export class ProjectGrid {
    private group: THREE.Group = new THREE.Group()
    private meshes: Map<string, THREE.Mesh> = new Map()
    private activeMesh: THREE.Mesh | null = null

    private isTransitioning = false
    private transitionProgress = 0

    private startPos = new THREE.Vector3()
    private startScale = new THREE.Vector3()
    private targetPos = new THREE.Vector3()
    private targetScale = new THREE.Vector3()

    private uProgress = uniform(0)
    private gallery: ProjectGallery | null = null

    constructor(
        private scene: THREE.Scene,
        private camera: any,
        private ui: UIManager
    ) {
        this.init()
    }

    public setGallery(gallery: ProjectGallery) {
        this.gallery = gallery
    }

    private init() {
        PROJECTS.forEach((project) => {
            const geometry = new THREE.PlaneGeometry(2, 3)
            const tex = new THREE.TextureLoader().load(project.textureUrl)

            const material = new MeshStandardNodeMaterial({
                roughness: 0.1,
                metalness: 0.5
            })

            const currentUv = uv()
            const center = vec2(0.5, 0.5)
            
            // Cinematic Stretch: Radial warp that intensifies during transition
            // Pulls the texture outwards as it expands
            const warp = mul(mul(sub(currentUv, center), this.uProgress), 0.2)
            const stretchUv = add(currentUv, warp)

            // Chromatic Aberration: Slight offset for RGB channels during transition
            const shift = mul(this.uProgress, 0.01)
            const rUv = add(stretchUv, vec2(shift, 0))
            const gUv = stretchUv
            const bUv = sub(stretchUv, vec2(shift, 0))

            const r = texture(tex).sample(rUv).r
            const g = texture(tex).sample(gUv).g
            const b = texture(tex).sample(bUv).b
            
            material.colorNode = vec3(r, g, b)

            const mesh = new THREE.Mesh(geometry, material)
            mesh.userData = { project }
            this.meshes.set(project.id, mesh)
            this.group.add(mesh)
        })

        this.scene.add(this.group)
    }

    private syncPositions() {
        if (!this.gallery) return

        const items = this.gallery.getGalleryItems()
        const projectIds = Array.from(this.meshes.keys())

        items.forEach((item, index) => {
            const projectId = projectIds[index]
            if (!projectId) return
            const mesh = this.meshes.get(projectId)
            if (!mesh || mesh === this.activeMesh) return

            const rect = item.getBoundingClientRect()
            
            // Convert Screen Space to NDC (-1 to 1)
            const x = ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1
            const y = -((rect.top + rect.height / 2) / window.innerHeight) * 2 + 1

            // Map NDC to World Space at a fixed distance
            const dist = this.camera.instance.position.z
            const fov = this.camera.instance.fov * (Math.PI / 180)
            const aspect = this.camera.instance.aspect

            const worldX = x * Math.tan(fov / 2) * dist * aspect
            const worldY = y * Math.tan(fov / 2) * dist

            mesh.position.set(worldX, worldY, 0)
            mesh.scale.set(1, 1, 1)
        })
    }

    public update(delta: number) {
        if (this.isTransitioning && this.activeMesh) {
            this.transitionProgress += delta * 1.5
            if (this.transitionProgress > 1) this.transitionProgress = 1
            
            const eased = 1 - Math.pow(1 - this.transitionProgress, 3)
            this.uProgress.value = eased
            
            if (this.transitionProgress >= 1) {
                this.isTransitioning = false
                const project = this.activeMesh.userData.project
                this.ui.showProjectContent(project)
            }
            
            this.activeMesh.position.lerpVectors(this.startPos, this.targetPos, eased)
            this.activeMesh.scale.lerpVectors(this.startScale, this.targetScale, eased)
        } else {
            this.uProgress.value = this.activeMesh ? 1 : 0
            this.syncPositions()
        }
    }

    public focus(projectId: string) {
        const mesh = this.meshes.get(projectId)
        if (!mesh) return

        if (this.gallery) this.gallery.setFocusedProject(projectId)
        this.activeMesh = mesh
        this.isTransitioning = true
        this.transitionProgress = 0

        this.startPos.copy(mesh.position)
        this.startScale.copy(mesh.scale)

        this.targetPos.set(0, 0, 0)

        const dist = this.camera.instance.position.z
        const fov = this.camera.instance.fov * (Math.PI / 180)
        const height = 2 * Math.tan(fov / 2) * dist
        const width = height * this.camera.instance.aspect
        const scaleFactor = Math.max(width / 2, height / 3)
        this.targetScale.set(scaleFactor, scaleFactor, 1)
    }

    public unfocus() {
        if (!this.activeMesh) return

        if (this.gallery) this.gallery.setFocusedProject(null)
        this.isTransitioning = true
        this.transitionProgress = 0

        this.startPos.copy(this.activeMesh.position)
        this.startScale.copy(this.activeMesh.scale)

        this.targetPos.set(0, 0, 0)
        this.targetScale.set(1, 1, 1)

        this.ui.hideProjectContent()
    }
}
