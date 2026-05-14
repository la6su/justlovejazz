import * as THREE from 'three';

export class WorldAtmosphere {
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.initBG();
        this.initFog();
    }

    // ── Junni BG pattern: gradient sphere / background color
    private initBG() {
        this.scene.background = new THREE.Color(0x000000);
    }

    private initFog() {
        // Thin exponential fog for depth cues
        this.scene.fog = new THREE.FogExp2(new THREE.Color(0x000000), 0.04);
    }

    public setFog(color: THREE.Color, density: number) {
        this.scene.fog = new THREE.FogExp2(color, density);
    }

    public setBackground(color: THREE.Color) {
        this.scene.background = color;
    }

    public update(_time: number) {
        // No particle animation — zero CPU per frame
    }

    public dispose() {
        this.scene.fog = null;
        this.scene.background = null;
    }
}
