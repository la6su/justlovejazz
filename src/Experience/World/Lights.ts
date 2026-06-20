// src/Experience/World/Lights.ts — Cinematic multi-light setup
// Lights smoothly transition between section moods (lerp, not snap).
import * as THREE from 'three'

export class CinematicLights {
    private keyLight!: THREE.DirectionalLight
    private keyTarget!: THREE.Object3D
    private fillLight!: THREE.DirectionalLight
    private rimLight!: THREE.DirectionalLight
    private volumetricLight!: THREE.PointLight
    private hemiLight!: THREE.HemisphereLight
    private readonly group!: THREE.Group

    // Target mood values (set by setMood, lerped toward in update)
    private targetKeyColor = new THREE.Color(0xffffee)
    private targetFillColor = new THREE.Color(0x88aaff)
    private targetRimColor = new THREE.Color(0x4488ff)
    private targetKeyIntensity = 1.8
    private targetFillIntensity = 0.5
    private targetRimIntensity = 1.2
    private targetVolumetricIntensity = 0.6
    private targetHemiIntensity = 0.3

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

    setKeyTarget(target: THREE.Object3D) {
        this.keyTarget.position.copy(target.position)
    }

    /**
     * Set target mood — lights will lerp toward these values in update().
     * warmth: 0-1 (cool→warm hue shift)
     * intensity: 0-1 (overall light intensity multiplier)
     * rimColor: optional explicit rim light color
     */
    setMood(warmth: number, intensity: number, rimColor?: THREE.Color) {
        const colorKey = new THREE.Color().setHSL(0.12 * warmth, 0.4, 0.85)
        const colorFill = new THREE.Color().setHSL(0.55 - warmth * 0.15, 0.25, 0.55)

        this.targetKeyColor.copy(colorKey)
        this.targetFillColor.copy(colorFill)
        if (rimColor) this.targetRimColor.copy(rimColor)

        this.targetKeyIntensity = 0.8 + intensity * 1.2
        this.targetVolumetricIntensity = intensity * 0.6
        this.targetHemiIntensity = 0.15 + intensity * 0.3
    }

    /**
     * Per-frame light update — smoothly lerp colors + intensities toward
     * target mood. Call from Experience.update() with dt.
     */
    update(dt: number): void {
        // Lerp factor: framerate-independent, ~0.5s transition.
        const t = Math.min(dt * 3.0, 1)

        this.keyLight.color.lerp(this.targetKeyColor, t)
        this.fillLight.color.lerp(this.targetFillColor, t)
        this.rimLight.color.lerp(this.targetRimColor, t)

        this.keyLight.intensity += (this.targetKeyIntensity - this.keyLight.intensity) * t
        this.fillLight.intensity += (this.targetFillIntensity - this.fillLight.intensity) * t
        this.rimLight.intensity += (this.targetRimIntensity - this.rimLight.intensity) * t
        this.volumetricLight.intensity += (this.targetVolumetricIntensity - this.volumetricLight.intensity) * t
        this.hemiLight.intensity += (this.targetHemiIntensity - this.hemiLight.intensity) * t

        // Subtle volumetric light orbit for organic atmosphere
        const time = performance.now() * 0.0005
        this.volumetricLight.position.x = Math.sin(time) * 2
        this.volumetricLight.position.z = Math.cos(time) * 2
    }

    dispose() {
        this.group.traverse((object) => {
            if (object instanceof THREE.Light) {
                object.dispose()
            }
        })
    }
}
