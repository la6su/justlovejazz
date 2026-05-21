// src/Experience/Camera.ts — Cinematic camera: inertia, organic shake, FOV dynamics
import * as THREE from 'three'
import { Sizes } from './Sizes'
import { input } from './Input'
import { Easings } from '../Utils/Easings'
import { Device } from '../core/DeviceCapability'
import type { CameraTarget } from '../core/types'

// Zero-allocation vectors
const _offsetVec = new THREE.Vector3()
const _tempQuat = new THREE.Quaternion()
const _tempEuler = new THREE.Euler()

// Spring-damper state
const springX = { pos: 0, vel: 0, target: 0 }
const springY = { pos: 0, vel: 0, target: 0 }

const SP_STIFFNESS = 8
const SP_DAMPING = 3

export class Camera {
    instance: THREE.PerspectiveCamera

    // Smooth state
    private smoothPosition = new THREE.Vector3()
    private smoothTarget = new THREE.Vector3()
    private smoothFov = 75

    // Velocity tracking for Environment
    private velocity = new THREE.Vector3()
    private prevPosition = new THREE.Vector3()

    // ── Action shake ──
    private shakePower = 0
    private shakeDuration = 0
    private shakeTime = 0

    // ── Organic shake clock ──
    private organicTime = 0

    // ── FOV pulse ──
    private fovOffset = 0
    private targetFovOffset = 0
    private fovTransitionT = 0
    private fovStartOffset = 0
    private fovDuration = 1.0

    constructor(sizes: Sizes) {
        this.instance = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
        this.smoothPosition.set(0, 0, 3)
        this.instance.position.copy(this.smoothPosition)
        this.prevPosition.copy(this.smoothPosition)

        window.addEventListener('resize', () => {
            this.instance.aspect = sizes.width / sizes.height
            this.instance.updateProjectionMatrix()
        })
    }

    setBasePosition(pos: THREE.Vector3) {
        this.smoothPosition.copy(pos)
    }

    /** Lerp camera base state toward target with exponential smoothing */
    updateSmooth(target: CameraTarget, deltaT: number, smoothing = 5) {
        if (!target) return
        const lerp = 1 - Math.exp(-smoothing * deltaT)

        this.smoothPosition.lerp(target.position, lerp)
        this.smoothTarget.lerp(target.lookAt, lerp)
        this.smoothFov += (target.fov - this.smoothFov) * lerp
    }

    getVelocity() {
        return this.velocity
    }

    /** Trigger an action shake (impact on section change) */
    shake(power = 0.1, duration = 0.5) {
        this.shakePower = power
        this.shakeDuration = duration
    }

    /** Set FOV offset for cinematic zoom-in on section arrival */
    setFovOffset(value: number, duration = 1) {
        this.fovStartOffset = this.fovOffset
        this.targetFovOffset = value
        this.fovDuration = duration
        this.fovTransitionT = 0
    }

    update(deltaT: number) {
        const dt = Math.min(Math.max(deltaT, 1 / 120), 0.1)

        // ── 1. Spring-damper cursor follow ──
        const mouse = input.getMouse()

        springX.target = mouse.x
        springY.target = mouse.y

        springX.vel += (springX.target - springX.pos) * SP_STIFFNESS * dt
        springY.vel += (springY.target - springY.pos) * SP_STIFFNESS * dt

        springX.vel *= Math.exp(-SP_DAMPING * dt)
        springY.vel *= Math.exp(-SP_DAMPING * dt)

        springX.pos += springX.vel * dt
        springY.pos += springY.vel * dt

    // ── 2. Build position ──
        const isMobile = Device.isMobile;
        const isHome = document.body?.dataset?.page === 'home';
        const pos = this.instance.position;

        // Cursor follow — spring-damper (disabled on mobile)
        const cursorX = isMobile ? 0 : springX.pos;
        const cursorY = isMobile ? 0 : springY.pos;

        const cursorFollow = isHome ? 0.19 : 0.15
        pos.set(
            this.smoothPosition.x + cursorX * cursorFollow,
            this.smoothPosition.y + cursorY * cursorFollow,
            this.smoothPosition.z
        );

        // ── 3. Organic shake (continuous handheld) — desktop only ──
        if (!isMobile) {
            this.organicTime += dt;
            const ot = this.organicTime;
            const amp = isHome ? 0.0026 : 0.002
            const ox = (Math.sin(ot * 0.7) * 0.3 + Math.sin(ot * 1.3) * 0.2) * amp;
            const oy = (Math.sin(ot * 0.9) * 0.2 + Math.sin(ot * 1.7) * 0.3) * amp;
            const oz = (Math.sin(ot * 1.1) * 0.4 + Math.sin(ot * 2.1) * 0.1) * amp;
            pos.x += ox;
            pos.y += oy;
            pos.z += oz;
        }

        // ── 4. Look at target ──
        this.instance.lookAt(this.smoothTarget)

        // ── 5. FOV — dynamic offset (pop zoom) ──
        if (this.fovTransitionT < 1) {
            this.fovTransitionT = Math.min(1, this.fovTransitionT + dt / this.fovDuration)
            const easeT = Easings.easeInOutQuart(this.fovTransitionT)
            this.fovOffset = this.fovStartOffset + (this.targetFovOffset - this.fovStartOffset) * easeT
        }

        if (this.fovOffset > 0) {
            _offsetVec.set(0, 0, -this.fovOffset * 0.05)
            _offsetVec.applyQuaternion(this.instance.quaternion)
            pos.add(_offsetVec)
        }

        // Blend FOV smoothly
        const fovBreath = isHome && !isMobile ? Math.sin(this.organicTime * 0.45) * 0.18 : 0
        const targetFov = this.smoothFov + this.fovOffset + fovBreath
        this.instance.fov += (targetFov - this.instance.fov) * 0.25
        this.instance.updateProjectionMatrix()

        // ── 6. Action shake ──
        if (this.shakePower > 0) {
            this.shakeTime += dt

            if (this.shakeDuration <= 0) {
                this.shakePower = 0
                this.shakeDuration = 0
            } else {
                const sx = Math.sin(this.shakeTime * 7) * Math.sin(this.shakeTime * 4) * 0.1 * this.shakePower
                const sy = Math.sin(this.shakeTime * 3.3) * Math.sin(this.shakeTime * 5.2) * 0.1 * this.shakePower

                _tempEuler.set(sx, sy, 0)
                _tempQuat.setFromEuler(_tempEuler)
                this.instance.quaternion.multiply(_tempQuat)
            }
            this.shakeDuration -= dt
        }

        // ── 7. Velocity ──
        this.velocity.subVectors(pos, this.prevPosition).divideScalar(dt)
        this.prevPosition.copy(pos)
    }
}
