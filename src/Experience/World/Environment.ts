
import * as THREE from 'three'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { cinematicGridNode } from '../../shaders/env-effects.tsl.ts'
import { 
   uniform, 
   uv, 
   time, 
   positionLocal, 
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
    private envMap!: THREE.Texture

    constructor(scene: THREE.Scene) {
        this.setupFog(scene)
        this.setupLights(scene)
        this.setupParticles(scene)
        this.setupGrid(scene)
        this.setupHDR(scene)
    }

    private async setupHDR(scene: THREE.Scene) {
        const loader = new HDRLoader()
        try {
            // Path to local HDR asset in public/assets/env/
            const texture = await loader.loadAsync('/assets/env/studio.hdr')
            texture.mapping = THREE.EquirectangularReflectionMapping

            
            this.envMap = texture
            scene.environment = texture
            // scene.background = texture // Optional: set as background if needed
            
            console.log('Environment: HDR loaded successfully')
        } catch (e) {
            console.warn('Environment: Failed to load HDR, using default lighting', e)
        }
    }

    private setupFog(scene: THREE.Scene) {
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
        
        const camVel = uniform(new THREE.Vector3(0, 0, 0))
        this.cameraVelocityUniform = camVel

        const material = new THREE.PointsMaterial({
            size: 0.02,
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        }) as any

        material.positionNode = add(
            positionLocal,
            mul(camVel, 0.05)
        )
        
        this.particles = new THREE.Points(geometry, material)
        scene.add(this.particles)
    }

    private setupGrid(scene: THREE.Scene) {
        const size = 100
        const geometry = new THREE.PlaneGeometry(size, size)
        
        const bakuPos = uniform(new THREE.Vector2(0, 0))
        this.bakuPosUniform = bakuPos
        
        this.gridMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.5
        }) as any
        
        this.gridMaterial.colorNode = cinematicGridNode(uv(), time)
        
        this.grid = new THREE.Mesh(geometry, this.gridMaterial)
        this.grid.rotation.x = -Math.PI / 2
        this.grid.position.y = -1
        
        scene.add(this.grid)
    }

    update(timeVal: number, scrollValue: number, camVelocity: THREE.Vector3, bakuPosition: THREE.Vector3) {
        this.cameraVelocityUniform.value = camVelocity
        
        this.bakuPosUniform.value.set(
            (bakuPosition.x / 100) + 0.5,
            (bakuPosition.z / 100) + 0.5
        )

        this.particles.rotation.y = timeVal * 0.05
        this.particles.rotation.x = timeVal * 0.02
        this.grid.position.z = (scrollValue * 0.5) % 1
    }

    setLighting(color: THREE.Color, intensity: number) {
        // Smooth transition for ambient light
        this.ambientLight.color.lerp(color, 0.05)
        
        // Point light intensity smoothing
        this.pointLight.intensity = THREE.MathUtils.lerp(this.pointLight.intensity, intensity, 0.05)
        
        // If we have HDR, we can also modulate environment intensity
        if (this.envMap) {
            // In a real production scenario, we'd use a custom env-light node 
            // or modulate the environment intensity via the renderer/scene
        }
    }
}

