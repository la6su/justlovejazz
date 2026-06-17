import * as THREE from 'three';

export class WorldAtmosphere {
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.initBG();
        this.initFog();
    }

    // ── Background: solid color from phase config (Junni: vivid colors per section)
    private initBG() {}

    private initFog() {}

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
