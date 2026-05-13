// src/core/SceneContentManager.ts
import * as THREE from 'three';
import { NarrativePhase } from './types';
import { easeInOutCubic } from './utils';

/**
 * Manages dynamic scene content transitions between sections.
 * Each section has its own 3D group. Transitions are delta-time driven.
 */
export class SceneContentManager {
    private scene: THREE.Scene;
    private groups: Map<NarrativePhase, THREE.Group> = new Map();
    private currentPhase: NarrativePhase | null = null;

    // Transition state (driven from Experience.update)
    private targetPhase: NarrativePhase | null = null;
    private transitionProgress: number = 0;
    private transitionDuration: number = 1.2;
    private isTransitioning: boolean = false;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.initGroups();
    }

    private initGroups() {
        for (const phase of Object.values(NarrativePhase)) {
            const group = new THREE.Group();
            group.name = `scene-${phase}`;
            group.visible = false;
            this.groups.set(phase as NarrativePhase, group);
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
            const oldGroup = this.currentPhase !== null ? this.groups.get(this.currentPhase) : null;
            const newGroup = this.groups.get(phase);
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

        const newGroup = this.groups.get(phase);
        if (newGroup) newGroup.visible = true;
    }

    /**
     * Call every frame with delta time. Advances the transition.
     */
    public update(deltaTime: number): void {
        if (!this.isTransitioning || !this.targetPhase) return;

        const oldGroup = this.currentPhase !== null ? this.groups.get(this.currentPhase) : null;
        const newGroup = this.groups.get(this.targetPhase);

        if (!oldGroup || !newGroup) {
            this.endTransition();
            return;
        }

        this.transitionProgress += deltaTime;
        const t = Math.min(this.transitionProgress / this.transitionDuration, 1);
        const eased = easeInOutCubic(t);

        // Crossfade opacity
        this.setGroupOpacity(oldGroup, 1 - eased);
        this.setGroupOpacity(newGroup, eased);

        // Scale breathing
        oldGroup.scale.setScalar(1 + eased * 0.5);
        newGroup.scale.setScalar(1 - eased * 0.3);

        // Rotation drift during transition
        oldGroup.rotation.y = eased * 0.2;
        newGroup.rotation.y = (1 - eased) * -0.1;

        if (t >= 1) {
            this.endTransition();
        }
    }

    private setGroupOpacity(group: THREE.Group, opacity: number): void {
        group.traverse((obj) => {
            if (obj instanceof THREE.Mesh && obj.material) {
                const mat = obj.material;
                mat.opacity = opacity;
                mat.transparent = true;
                mat.needsUpdate = true;
            }
        });
    }

    private endTransition(): void {
        const oldGroup = this.currentPhase !== null ? this.groups.get(this.currentPhase) : null;
        const newGroup = this.targetPhase ? this.groups.get(this.targetPhase) : null;

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
            if (obj instanceof THREE.Mesh && obj.material) {
                obj.material.opacity = opacity;
            }
        });
    }

    /**
     * Get the group for a specific phase to populate content.
     */
    public getGroup(phase: NarrativePhase): THREE.Group {
        return this.groups.get(phase)!;
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
        this.groups.forEach(group => {
            group.traverse(obj => {
                if (obj instanceof THREE.Mesh) {
                    obj.geometry?.dispose();
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else if (obj.material) {
                        obj.material.dispose();
                    }
                }
            });
            group.clear();
        });
        this.groups.forEach(g => this.scene.remove(g));
        this.groups.clear();
    }
}
