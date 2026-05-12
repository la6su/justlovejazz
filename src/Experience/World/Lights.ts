// src/Experience/World/Lights.ts — Cinematic multi-light setup
import * as THREE from 'three'

export class CinematicLights {
    private keyLight!: THREE.DirectionalLight
    private keyTarget!: THREE.Object3D
    private fillLight!: THREE.DirectionalLight
    private rimLight!: THREE.DirectionalLight
    private volumetricLight!: THREE.PointLight
    private hemiLight!: THREE.HemisphereLight
    private readonly group!: THREE.Group

    constructor(scene: THREE.Scene) {
        this.group = new THREE.Group()
        this.group.name = 'cinematic-lights'

        this.setupKey()
        this.setupFill()
        this.setupRim()
        this.setupVolumetric()
        this.setupHemisphere()

        scene.add(this.group)
    }

    private setupKey() {
        this.keyTarget = new THREE.Object3D()
        this.keyLight = new THREE.DirectionalLight(0xffffee, 1.8)
        this.keyLight.position.set(3, 4, 3)
        this.keyLight.castShadow = true
        this.group.add(this.keyLight)
        this.group.add(this.keyTarget)
    }

    private setupFill() {
        this.fillLight = new THREE.DirectionalLight(0x88aaff, 0.5)
        this.fillLight.position.set(-4, 2, 1)
        this.group.add(this.fillLight)
    }

    private setupRim() {
        this.rimLight = new THREE.DirectionalLight(0x4488ff, 1.2)
        this.rimLight.position.set(0, 2, -4)
        this.group.add(this.rimLight)
    }

    private setupVolumetric() {
        this.volumetricLight = new THREE.PointLight(0xff6622, 0.6, 12)
        this.volumetricLight.position.set(0, 1.5, 0)
        this.group.add(this.volumetricLight)
    }

    private setupHemisphere() {
        this.hemiLight = new THREE.HemisphereLight(0x012345, 0x000000, 0.3)
        this.group.add(this.hemiLight)
    }

    // — Attach key light target to any focal object
    setKeyTarget(target: THREE.Object3D) {
        this.keyTarget.position.copy(target.position)
    }

    // — Section-based color transitions
    setMood(warmth: number, intensity: number, rimColor?: THREE.Color) {
        const colorKey = new THREE.Color().setHSL(0.12 * warmth, 0.4, 0.85)
        const colorFill = new THREE.Color().setHSL(0.55 - warmth * 0.15, 0.25, 0.55)

        this.keyLight.color.copy(colorKey)
        this.fillLight.color.copy(colorFill)

        if (rimColor) {
            this.rimLight.color.copy(rimColor)
        }

        this.keyLight.intensity = 0.8 + intensity * 1.2
        this.volumetricLight.intensity = intensity * 0.6
        this.hemiLight.intensity = 0.15 + intensity * 0.3
    }

    dispose() {
        this.group.traverse((object) => {
            if (object instanceof THREE.Light) {
                object.dispose()
            }
        })
    }
}
