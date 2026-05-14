// src/core/SceneContentManager.ts
import * as THREE from 'three';
import { NarrativePhase } from './types';
import { easeInOutCubic } from './utils';

interface PhaseTransitionPreset {
    enterScale: number
    exitScale: number
    enterRotationY: number
    exitRotationY: number
}

const PHASE_TRANSITION_PRESETS: Record<NarrativePhase, PhaseTransitionPreset> = {
    [NarrativePhase.AWAKENING]: { enterScale: 0.86, exitScale: 1.14, enterRotationY: -0.18, exitRotationY: 0.12 },
    [NarrativePhase.DISCOVERY]: { enterScale: 0.88, exitScale: 1.12, enterRotationY: -0.14, exitRotationY: 0.16 },
    [NarrativePhase.DEEP_DIVE]: { enterScale: 0.92, exitScale: 1.08, enterRotationY: -0.1, exitRotationY: 0.18 },
    [NarrativePhase.CONNECTION]: { enterScale: 0.9, exitScale: 1.1, enterRotationY: -0.12, exitRotationY: 0.1 },
}

const PHASE_ORDER: NarrativePhase[] = [
    NarrativePhase.AWAKENING,
    NarrativePhase.DISCOVERY,
    NarrativePhase.DEEP_DIVE,
    NarrativePhase.CONNECTION,
]

/**
 * Manages dynamic scene content transitions between sections.
 * Each section has its own 3D group. Transitions are delta-time driven.
 * Idle animation keeps objects alive between transitions.
 */
export class SceneContentManager {
    private scene: THREE.Scene;
    private _groups: Map<NarrativePhase, THREE.Group> = new Map();
    public get groups(): Map<NarrativePhase, THREE.Group> {
        return this._groups;
    }
    private currentPhase: NarrativePhase | null = null;

    // Transition state (driven from Experience.update)
    private targetPhase: NarrativePhase | null = null;
    private transitionProgress: number = 0;
    private transitionDuration: number = 1.2;
    private isTransitioning: boolean = false;

    // Elapsed time counter for idle animation
    private elapsed: number = 0;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.initGroups();
    }

    private initGroups() {
        for (const phase of Object.values(NarrativePhase)) {
            const group = new THREE.Group();
            group.name = `scene-${phase}`;
            group.visible = false;
            this._groups.set(phase as NarrativePhase, group);
            this.scene.add(group);
        }
    }

    /**
     * Queue a transition to the target phase.
     * Pass duration=0 for instant activation (no animation).
     */
    public queueTransition(phase: NarrativePhase, duration?: number): void {
        if (phase === this.currentPhase) return;
        if (this.isTransitioning && this.targetPhase === phase) return;

        // Instant activation — no animation
        if (duration === 0) {
            const oldGroup = this.currentPhase !== null ? this._groups.get(this.currentPhase) : null;
            const newGroup = this._groups.get(phase);
            if (oldGroup) {
                oldGroup.visible = false;
                oldGroup.scale.setScalar(1);
                oldGroup.rotation.set(0, 0, 0);
            }
            if (newGroup) {
                newGroup.visible = true;
                newGroup.scale.setScalar(1);
                newGroup.rotation.set(0, 0, 0);
            }
            this.currentPhase = phase;
            return;
        }

        this.targetPhase = phase;
        this.transitionDuration = duration ?? this.transitionDuration;
        this.transitionProgress = 0;
        this.isTransitioning = true;

        const newGroup = this._groups.get(phase);
        if (newGroup) {
            newGroup.visible = true;
            const preset = PHASE_TRANSITION_PRESETS[phase];
            newGroup.scale.setScalar(preset.enterScale);
            newGroup.rotation.y = preset.enterRotationY;
            this.setGroupOpacity(newGroup, 0);
        }
    }

    /**
     * Call every frame with delta time. Advances transitions + runs idle animation.
     */
    public update(deltaTime: number): void {
        this.elapsed += deltaTime;

        if (this.isTransitioning && this.targetPhase) {
            this.runTransition(deltaTime);
        }

        // Idle animation on current content
        if (this.currentPhase !== null && !this.isTransitioning) {
            const group = this._groups.get(this.currentPhase);
            if (group) this.animateIdle(group, deltaTime);
        }
    }

    /**
     * Scroll/timeline-driven content blending.
     * Keeps section content transitions deterministic and synchronized with world state.
     */
    public syncToTimeline(currentPhase: NarrativePhase, phaseProgress: number): void {
        const currentIndex = PHASE_ORDER.indexOf(currentPhase)
        if (currentIndex === -1) return

        const nextPhase = PHASE_ORDER[Math.min(currentIndex + 1, PHASE_ORDER.length - 1)]
        const currentGroup = this._groups.get(currentPhase)
        const nextGroup = this._groups.get(nextPhase)
        if (!currentGroup || !nextGroup) return

        // Hide non-participating groups for deterministic visuals and lower overdraw.
        this._groups.forEach((group, phase) => {
            group.visible = phase === currentPhase || phase === nextPhase
        })

        const t = THREE.MathUtils.clamp(phaseProgress, 0, 1)
        const fromPreset = PHASE_TRANSITION_PRESETS[currentPhase]
        const toPreset = PHASE_TRANSITION_PRESETS[nextPhase]

        if (currentPhase === nextPhase) {
            currentGroup.visible = true
            currentGroup.scale.setScalar(1)
            currentGroup.rotation.y = 0
            this.setGroupOpacity(currentGroup, 1)
            this.currentPhase = currentPhase
            return
        }

        currentGroup.visible = true
        nextGroup.visible = true

        this.setGroupOpacity(currentGroup, 1 - t)
        this.setGroupOpacity(nextGroup, t)

        currentGroup.scale.setScalar(THREE.MathUtils.lerp(1, fromPreset.exitScale, t))
        nextGroup.scale.setScalar(THREE.MathUtils.lerp(toPreset.enterScale, 1, t))
        currentGroup.rotation.y = THREE.MathUtils.lerp(0, fromPreset.exitRotationY, t)
        nextGroup.rotation.y = THREE.MathUtils.lerp(toPreset.enterRotationY, 0, t)

        this.currentPhase = currentPhase
    }

    private runTransition(deltaTime: number): void {
        const targetPhase = this.targetPhase
        if (!targetPhase) {
            this.endTransition()
            return
        }
        const oldGroup = this.currentPhase !== null ? this._groups.get(this.currentPhase) : null;
        const newGroup = this._groups.get(targetPhase);

        if (!oldGroup || !newGroup) {
            this.endTransition();
            return;
        }

        this.transitionProgress += deltaTime;
        const t = Math.min(this.transitionProgress / this.transitionDuration, 1);
        const eased = easeInOutCubic(t);

        const fromPhase = this.currentPhase ?? NarrativePhase.AWAKENING
        const fromPreset = PHASE_TRANSITION_PRESETS[fromPhase]
        const toPreset = PHASE_TRANSITION_PRESETS[targetPhase]

        // Crossfade opacity across Mesh/Line/Points materials
        this.setGroupOpacity(oldGroup, 1 - eased);
        this.setGroupOpacity(newGroup, eased);

        // Directed section transforms: old content exits out, new content settles in.
        oldGroup.scale.setScalar(THREE.MathUtils.lerp(1, fromPreset.exitScale, eased));
        newGroup.scale.setScalar(THREE.MathUtils.lerp(toPreset.enterScale, 1, eased));
        oldGroup.rotation.y = THREE.MathUtils.lerp(0, fromPreset.exitRotationY, eased);
        newGroup.rotation.y = THREE.MathUtils.lerp(toPreset.enterRotationY, 0, eased);

        if (t >= 1) {
            this.endTransition();
        }
    }

    /** Idle animation for objects in the active section */
    private animateIdle(group: THREE.Group, deltaTime: number): void {
        group.traverse((obj) => {
            if (!obj.userData.type) return;

            switch (obj.userData.type) {
                case 'floating-ring':
                    if (obj instanceof THREE.Mesh) {
                        obj.rotation.z += deltaTime * 0.15;
                        obj.rotation.y += deltaTime * 0.08;
                    }
                    break;

                case 'floating-cube':
                    if (obj instanceof THREE.Mesh) {
                        obj.rotation.x += deltaTime * 0.2;
                        obj.rotation.y += deltaTime * 0.15;
                        obj.position.y += Math.sin(this.elapsed * 0.5 + obj.position.x) * 0.001;
                    }
                    break;

                case 'particles':
                    if (obj instanceof THREE.Points) {
                        obj.rotation.y += deltaTime * 0.02;
                    }
                    break;

                case 'central-orb':
                    if (obj instanceof THREE.Mesh) {
                        const s = 1 + Math.sin(this.elapsed * 0.5) * 0.05;
                        obj.scale.setScalar(s);
                    }
                    break;

                case 'parametric-line':
                    // subtle sway — handled via parent group rotation if needed
                    break;

                case 'wireframe-grid':
                    // static — no idle
                    break;

                case 'halo':
                    if (obj instanceof THREE.Mesh) {
                        obj.rotation.z += deltaTime * 0.05;
                    }
                    break;
            }
        });
    }

    private setGroupOpacity(group: THREE.Group, opacity: number): void {
        group.traverse((obj) => {
            if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
                this.applyOpacityToObjectMaterials(obj, opacity);
            }
        });
    }

    private endTransition(): void {
        const oldGroup = this.currentPhase !== null ? this._groups.get(this.currentPhase) : null;
        const newGroup = this.targetPhase ? this._groups.get(this.targetPhase) : null;

        if (oldGroup) {
            oldGroup.visible = false;
            oldGroup.scale.setScalar(1);
            oldGroup.rotation.set(0, 0, 0);
            this.resetGroupOpacity(oldGroup, 1);
        }

        if (newGroup) {
            newGroup.scale.setScalar(1);
            newGroup.rotation.set(0, 0, 0);
            this.resetGroupOpacity(newGroup, 1);
        }

        this.currentPhase = this.targetPhase;
        this.targetPhase = null;
        this.isTransitioning = false;
        this.transitionProgress = 0;
    }

    private resetGroupOpacity(group: THREE.Group, opacity: number): void {
        group.traverse((obj) => {
            if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
                this.applyOpacityToObjectMaterials(obj, opacity);
            }
        });
    }

    private applyOpacityToObjectMaterials(
        obj: THREE.Mesh | THREE.Line | THREE.Points,
        opacity: number,
    ): void {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        materials.forEach((mat) => {
            if (!mat) return
            mat.opacity = opacity
            mat.transparent = opacity < 1 || mat.transparent
            mat.needsUpdate = true
        })
    }

    /**
     * Get the group for a specific phase to populate content.
     */
    public getGroup(phase: NarrativePhase): THREE.Group {
        return this._groups.get(phase)!;
    }

    /**
     * Populate a phase's group with 3D objects.
     */
    public setupPhaseContent(phase: NarrativePhase, objects: THREE.Object3D[]): void {
        this.getGroup(phase).add(...objects);
    }

    /**
     * Is scene currently transitioning?
     */
    get transitioning(): boolean {
        return this.isTransitioning;
    }

    /** get current transition progress (0..1) */
    get progress(): number {
        if (!this.isTransitioning) return 1;
        return Math.min(this.transitionProgress / this.transitionDuration, 1);
    }

    /**
     * Dispose all groups and materials.
     */
    public dispose(): void {
        this._groups.forEach(group => {
            group.traverse(obj => {
                if (obj instanceof THREE.Mesh) {
                    obj.geometry?.dispose();
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else if (obj.material) {
                        obj.material.dispose();
                    }
                }
                if (obj instanceof THREE.Points) {
                    obj.geometry?.dispose();
                    if (obj.material) obj.material.dispose();
                }
                if (obj instanceof THREE.Line) {
                    obj.geometry?.dispose();
                    if (obj.material) obj.material.dispose();
                }
            });
            group.clear();
        });
        this._groups.forEach(g => this.scene.remove(g));
        this._groups.clear();
    }
}
