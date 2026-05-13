import * as THREE from 'three'
import { type Project } from './types'
import { prefersReducedMotion } from './motionPolicy'

export enum GalleryTransitionState {
    LIST = 'list',
    EXPAND = 'expand',
    CONTRACT = 'contract'
}

export class GalleryManager {
    public activeIndex = 0
    public activeProjectId = ''
    public scrollX = 0
    public targetScrollX = 0
    public velocity = 0
    public smoothedVelocity = 0

    // Transition state machine
    public transitionState: GalleryTransitionState = GalleryTransitionState.LIST
    private _expandProgress = 0

    // Position cache
    public transitionStartPos = new THREE.Vector3()
    public transitionStartScale = 1

    // Config
    public readonly STEP = 3.5
    public readonly SMOOTHING = 0.1
    public readonly FRICTION = 0.92
    public readonly SENSITIVITY = 1.0
    public readonly WHEEL_SENSITIVITY = 0.0028
    private readonly transitionSpeed = 1.8
    /** Faster gallery expand/contract when user prefers reduced motion */
    private readonly transitionMotionMul = prefersReducedMotion() ? 3 : 1

    public get trackLength(): number {
        return this.projects.length * this.STEP
    }

    public get activeProject(): Project {
        return this.projects[this.activeIndex]
    }

    public get transitionProgress(): number {
        return this._expandProgress
    }

    public get isTransitioning(): boolean {
        return this.transitionState !== GalleryTransitionState.LIST
    }

    constructor(public projects: Project[]) {}

    public getCurrentViewPosition(): THREE.Vector3 {
        const p = this.projects[this.activeIndex]
        return new THREE.Vector3(p.viewPosition.x, p.viewPosition.y, p.viewPosition.z)
    }

    public getCurrentLookAt(): THREE.Vector3 {
        const p = this.projects[this.activeIndex]
        return new THREE.Vector3(p.viewLookAt.x, p.viewLookAt.y, p.viewLookAt.z)
    }

    setProject(index: number) {
        if (index < 0 || index >= this.projects.length) return
        const targetPos = index * this.STEP
        let diff = targetPos - this.targetScrollX
        const half = this.trackLength / 2
        if (diff > half) diff -= this.trackLength
        if (diff < -half) diff += this.trackLength
        this.targetScrollX += diff
        this.activeIndex = index
        this.activeProjectId = this.projects[index].id
        this.onProjectChange?.(this.projects[index])
    }

    drag(deltaX: number) {
        const move = deltaX * this.SENSITIVITY
        this.scrollX -= move
        this.targetScrollX -= move
    }

    setDragVelocity(velocity: number) {
        this.velocity = velocity * this.SENSITIVITY
        this.targetScrollX += this.velocity * 10
    }

    wheel(delta: number) {
        const move = delta * this.WHEEL_SENSITIVITY
        this.targetScrollX += move
        this.velocity += move * 0.3
    }

    getWrappedOffset(index: number): number {
        const trackLen = this.trackLength
        const half = trackLen / 2
        const pos = index * this.STEP - this.scrollX
        let wrapped = pos % trackLen
        if (wrapped < -half) wrapped += trackLen
        if (wrapped > half) wrapped -= trackLen
        return wrapped
    }

    /** Expand: card grows to fullscreen */
    expandCard(index: number, startPos: THREE.Vector3, startScale: number) {
        if (this.isTransitioning) return
        this.activeIndex = index
        this.activeProjectId = this.projects[index].id
        this.transitionStartPos.copy(startPos)
        this.transitionStartScale = startScale
        this._expandProgress = 0
        this.transitionState = GalleryTransitionState.EXPAND
        this.onChange?.()
    }

    /** Expand: fullscreen → list, card shrinks back */
    contractCard() {
        if (this.transitionState !== GalleryTransitionState.EXPAND) return
        this._expandProgress = 1
        this.transitionState = GalleryTransitionState.CONTRACT
        this.onChange?.()
    }

    private reset() {
        this.transitionState = GalleryTransitionState.LIST
        this._expandProgress = 0
        this.onChange?.()
    }

    update(deltaTime: number) {
        // Layout scroll (LIST only)
        if (this.transitionState === GalleryTransitionState.LIST) {
            const dist = this.targetScrollX - this.scrollX
            this.scrollX += dist * this.SMOOTHING
            this.smoothedVelocity += (dist - this.smoothedVelocity) * 0.12
            const currentPos = ((this.scrollX % this.trackLength) + this.trackLength) % this.trackLength
            const rawIdx = Math.round(currentPos / this.STEP)
            this.activeIndex = ((rawIdx % this.projects.length) + this.projects.length) % this.projects.length
        } else {
            this.smoothedVelocity *= 0.88
        }

        // Drive transition
        if (this.transitionState === GalleryTransitionState.EXPAND) {
            this._expandProgress += this.transitionSpeed * this.transitionMotionMul * deltaTime
            if (this._expandProgress >= 1) {
                this._expandProgress = 1
                this.onExpandComplete?.(this.activeProject)
                this.reset()
            }
        }

        if (this.transitionState === GalleryTransitionState.CONTRACT) {
            this._expandProgress -= this.transitionSpeed * this.transitionMotionMul * deltaTime
            if (this._expandProgress <= 0) {
                this._expandProgress = 0
                this.onContractComplete?.()
                this.reset()
            }
        }

        this.onStateChange?.(this.transitionState, this._expandProgress)
    }

    onProjectChange?: (project: Project) => void
    onStateChange?: (state: GalleryTransitionState, progress: number) => void
    onChange?: () => void
    onExpandComplete?: (project: Project) => void
    onContractComplete?: () => void
}
