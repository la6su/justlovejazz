// src/Experience/World/Environment.ts
import * as THREE from 'three'

import { cinematicGridNode } from '../../shaders/env-effects.tsl.ts'
import { 
    uniform, 
    uv, 
    time, 
    positionLocal, 
    vec3, 
    mul, 
    add 
} from 'three/tsl'

export class Environment {
    private particles!: THREE.Points
    private grid!: THREE.Mesh
    private gridMaterial!: THREE.MeshBasicMaterial
    private ambientLight!: THREE.AmbientLight
    private pointLight!: THREE.PointLight
    private cameraVelocityUniform!: any
    private bakuPosUniform!: any

    constructor(scene: THREE.Scene) {
        this.setupFog(scene)
        this.setupLights(scene)
        this.setupParticles(scene)
        this.setupGrid(scene)
    }

    private setupFog(scene: THREE.Scene) {
        // Exponential Height Fog for atmospheric depth
        scene.fog = new THREE.FogExp2(0x05050a, 0.05)
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
        
        // Camera velocity uniform for reactive motion
        const camVel = uniform(new THREE.Vector3(0, 0, 0))
        this.cameraVelocityUniform = camVel

        const material = new THREE.PointsMaterial({
            size: 0.02,
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        }) as any

        // TSL override for vertex position to add camera-reactive drift
        material.positionNode = add(
            positionLocal,
            mul(camVel, 0.05)
        )
        
        this.particles = new THREE.Points(geometry, material)
        scene.add(this.particles)
    }

    private setupGrid(scene: THREE.Scene) {
        const size = 100 // Increased size for the horizon effect
        const geometry = new THREE.PlaneGeometry(size, size)
        
        const gridColor = uniform(new THREE.Color(0x333333))
        const bakuPos = uniform(new THREE.Vector2(0, 0))
        this.bakuPosUniform = bakuPos
        
        // Using standard MeshBasicMaterial and assigning colorNode.
        // In Three.js r167+, WebGPURenderer treats this as a NodeMaterial.
        this.gridMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.5
        }) as any
        
        this.gridMaterial.colorNode = cinematicGridNode(gridColor, time, uv(), bakuPos)
        
        this.grid = new THREE.Mesh(geometry, this.gridMaterial)
        this.grid.rotation.x = -Math.PI / 2
        this.grid.position.y = -1
        
        scene.add(this.grid)
    }

    update(timeVal: number, scrollValue: number, camVelocity: THREE.Vector3, bakuPosition: THREE.Vector3) {
        // Update uniforms
        this.cameraVelocityUniform.value = camVelocity
        
        // Map Baku's world position to UV space (0..1)
        // Grid size is 100, centered at 0. So world -50..50 maps to 0..1
        this.bakuPosUniform.value.set(
            (bakuPosition.x / 100) + 0.5,
            (bakuPosition.z / 100) + 0.5
        )

        // Медленное вращение частиц для создания жизни
        this.particles.rotation.y = timeVal * 0.05
        this.particles.rotation.x = timeVal * 0.02
        
        // Смещение сетки в зависимости от скролла (параллакс)
        this.grid.position.z = (scrollValue * 0.5) % 1
    }

    setLighting(color: THREE.Color, intensity: number) {
        this.ambientLight.color.lerp(color, 0.05)
        this.pointLight.intensity = THREE.MathUtils.lerp(this.pointLight.intensity, intensity, 0.05)
    }
}
