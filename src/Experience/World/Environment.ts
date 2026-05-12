// src/Experience/World/Environment.ts — Atmosphere: fog, particles, procedural grid
import * as THREE from 'three'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'

export class Environment {
    private particles!: THREE.Points
    private particleMaterial!: THREE.PointsMaterial
    private grid!: THREE.Mesh
    private gridMaterial!: THREE.MeshBasicMaterial

    constructor(scene: THREE.Scene) {
        scene.fog = new THREE.FogExp2(0x05050a, 0.04)
        this.setupParticles(scene)
        this.setupGrid(scene)
    }

    public async init(scene: THREE.Scene): Promise<void> {
        await this.setupHDR(scene)
    }

    private async setupHDR(scene: THREE.Scene) {
        const loader = new HDRLoader()
        try {
            const texture = await loader.loadAsync('/assets/env/studio.hdr')
            texture.mapping = THREE.EquirectangularReflectionMapping
            scene.environment = texture
            console.log('Environment: HDR loaded')
        } catch (e) {
            console.warn('Environment: HDR load failed, using default lighting', e)
        }
    }

    private setupParticles(scene: THREE.Scene) {
        const count = 1500
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(count * 3)

        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 20
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

        this.particleMaterial = new THREE.PointsMaterial({
            size: 0.015,
            color: 0xffffff,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending
        })

        this.particles = new THREE.Points(geometry, this.particleMaterial)
        scene.add(this.particles)
    }

    private setupGrid(scene: THREE.Scene) {
        const size = 100
        const geometry = new THREE.PlaneGeometry(size, size)

        this.gridMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            wireframe: true,
            transparent: true,
            opacity: 0.35
        })

        this.grid = new THREE.Mesh(geometry, this.gridMaterial)
        this.grid.rotation.x = -Math.PI / 2
        this.grid.position.y = -1

        scene.add(this.grid)
    }

    update(time: number, scroll: number, camVelocity: THREE.Vector3) {
        this.particles.rotation.y = time * 0.02
        this.particles.rotation.x = time * 0.01
        this.particles.position.copy(camVelocity).multiplyScalar(0.05)
        this.grid.position.z = (scroll * 0.5) % 1
    }

    dispose() {
        this.particleMaterial.dispose()
        this.gridMaterial.dispose()
    }
}
