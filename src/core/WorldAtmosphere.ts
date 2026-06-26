// WorldAtmosphere — thin wrapper over scene fog and background.
// Provides a stable API for Experience/World to update atmosphere
// without directly touching scene.fog and scene.background.
//
// Background color is owned by BG.ts (lerped per-section).
// This class only manages fog. initBG/initFog were intentionally
// left empty — actual setup happens in World.init() and BG.ts.

import * as THREE from 'three';

export class WorldAtmosphere {
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        // Fog is set lazily by setFog() when first section config resolves.
        // Background is owned by BG.ts — do not set here.
    }

    /** Update fog color + density (called on section context change). */
    public setFog(color: THREE.Color, density: number): void {
        if (this.scene.fog instanceof THREE.FogExp2) {
            this.scene.fog.color.copy(color);
            this.scene.fog.density = density;
        } else {
            this.scene.fog = new THREE.FogExp2(color.clone(), density);
        }
    }

    /** Update background directly (used when BG.ts is not managing it). */
    public setBackground(color: THREE.Color): void {
        this.scene.background = color;
    }

    /** No per-frame work — fog/background updates are event-driven. */
    public update(_time: number): void {}

    public dispose(): void {
        this.scene.fog = null;
        // Do NOT set scene.background = null — BG.ts owns it.
        // Setting null causes a black frame on WebGPU (HERMES_RULES §5).
    }
}
