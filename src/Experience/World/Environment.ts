// src/Experience/World/Environment.ts
import * as THREE from 'three'

export class Environment {
    private particles!: THREE.Points
    private grid!: THREE.LineSegments
    private ambientLight!: THREE.AmbientLight
    private pointLight!: THREE.PointLight

    constructor(scene: THREE.Scene) {
        this.setupLights(scene)
        this.setupParticles(scene)
        this.setupGrid(scene)
    }

    private setupLights(scene: THREE.Scene) {
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.5)
        scene.add(this.ambientLight)

        this.pointLight = new THREE.PointLight(0xffffff, 10)
        this.pointLight.position.set(2, 2, 2)
        scene.add(this.pointLight)
    }

    private setupParticles(scene: THREE.Scene) {
        const geometry = new THREE.BufferGeometry()
        const count = 2000
        const positions = new Float32Array(count * 3)
        
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 20
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        
        const material = new THREE.PointsMaterial({
            size: 0.02,
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        })

        this.particles = new THREE.Points(geometry, material)
        scene.add(this.particles)
    }

    private setupGrid(scene: THREE.Scene) {
        const size = 20
        const divisions = 20
        const geometry = new THREE.PlaneGeometry(size, size, divisions, divisions)
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x333333, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.2 
        })
        
        const gridMesh = new THREE.Mesh(geometry, material)
        gridMesh.rotation.x = -Math.PI / 2
        gridMesh.position.y = -1
        
        this.grid = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry), 
            new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.2 })
        )
        this.grid.rotation.x = -Math.PI / 2
        this.grid.position.y = -1
        
        scene.add(this.grid)
    }

    update(time: number, scrollValue: number) {
        // Медленное вращение частиц для создания жизни
        this.particles.rotation.y = time * 0.05
        this.particles.rotation.x = time * 0.02
        
        // Смещение сетки в зависимости от скролла (параллакс)
        this.grid.position.z = (scrollValue * 0.5) % 1
    }

    setLighting(color: THREE.Color, intensity: number) {
        this.ambientLight.color.lerp(color, 0.05)
        this.pointLight.intensity = THREE.MathUtils.lerp(this.pointLight.intensity, intensity, 0.05)
    }
}
