// src/Experience/Camera.ts
import * as THREE from 'three'
import { Sizes } from './Sizes'
import { input } from './Input'
import { Time } from './Time'

export class Camera {
    instance: THREE.PerspectiveCamera
    
    // --- Kinematics State ---
    private cursorPosDelay: THREE.Vector2 = new THREE.Vector2()
    private cursorPosDelayVel: THREE.Vector2 = new THREE.Vector2()
    
    private shakeTime: number = 0
    private shakePower: number = 0
    private shakeDuration: number = 0
    
    private fovOffset: number = 0
    private targetFovOffset: number = 0
    
    private basePosition: THREE.Vector3 = new THREE.Vector3(0, 0, 3)
    private moveRange: THREE.Vector2 = new THREE.Vector2(0.15, 0.15)

    constructor(sizes: Sizes) {
        this.instance = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
        this.instance.position.copy(this.basePosition)

        window.addEventListener('resize', () => {
            this.instance.aspect = sizes.width / sizes.height
            this.instance.updateProjectionMatrix()
        })
    }

    /**
     * Triggers an organic camera shake.
     * @param power Intensity of the shake
     * @param duration Duration in seconds
     */
    shake(power: number = 0.1, duration: number = 0.5) {
        this.shakePower = power
        this.shakeDuration = duration
    }

    /**
     * Sets the FOV offset (used for cinematic zooms)
     */
    setFovOffset(value: number, duration: number = 1) {
        this.targetFovOffset = value
        // In a full system, we'd use a tween here, but for now we lerp in update()
    }

    update(deltaTime: number) {
        // 1. Inertia-based Cursor Follow (The "Junni Feel")
        // We use a modified spring-damper system for that high-end weight
        const mouse = input.getMouse()
        
        // Adjusted deltaTime for consistency
        const dt = Math.min(0.1, deltaTime) * 0.5
        
        let diff = new THREE.Vector2().subVectors(mouse, this.cursorPosDelay).multiplyScalar(dt)
        // Nonlinear amplification: makes the movement feel "snappy" but smooth
        diff.multiply(diff.clone().addScalar(1.0))
        
        this.cursorPosDelayVel.add(diff.multiplyScalar(5.0))
        this.cursorPosDelayVel.multiplyScalar(0.85) // Damping
        this.cursorPosDelay.add(this.cursorPosDelayVel)

        // 2. Position Calculation
        // Camera drifts slightly based on the delayed cursor position
        this.instance.position.set(
            this.basePosition.x + this.cursorPosDelay.x * this.moveRange.x,
            this.basePosition.y + this.cursorPosDelay.y * this.moveRange.y,
            this.basePosition.z
        )

        // 3. Dynamic FOV Offset
        // Smoothly transition fovOffset
        this.fovOffset += (this.targetFovOffset - this.fovOffset) * 0.1
        if (this.fovOffset > 0) {
            // Push camera back slightly when FOV offset is applied to maintain focus
            const offsetVec = new THREE.Vector3(0, 0, -this.fovOffset * 0.05).applyQuaternion(this.instance.quaternion)
            this.instance.position.add(offsetVec)
        }

        // 4. Organic Shake
        if (this.shakePower > 0) {
            this.shakeTime += dt
            this.shakeDuration -= dt
            
            if (this.shakeDuration <= 0) {
                this.shakePower = 0
                this.shakeDuration = 0
            } else {
                // Junni-style combined sines for non-mechanical feel
                const shakeX = Math.sin(this.shakeTime * 7.0) * Math.sin(this.shakeTime * 4.0) * 0.1 * this.shakePower
                const shakeY = Math.sin(this.shakeTime * 3.3) * Math.sin(this.shakeTime * 5.2) * 0.1 * this.shakePower
                
                this.instance.applyQuaternion(
                    new THREE.Quaternion().setFromEuler(
                        new THREE.Euler(shakeX, shakeY, 0)
                    )
                )
            }
        }

        // Always look at center for now (unless World overrides this)
        this.instance.lookAt(0, 0, 0)
    }
}
