import * as THREE from 'three';

export class WorldAtmosphere {
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.initFog();
        // No particles — replaced by GradientBackground for performance
    }

    private initFog() {
        // Thin fog for depth
        this.scene.fog = new THREE.FogExp2(new THREE.Color(0x000000), 0.04);
    }

    public setFog(color: THREE.Color, density: number) {
        this.scene.fog = new THREE.FogExp2(color, density);
    }

    public update(_time: number) {
        // No particle animation — zero CPU per frame
    }

    public dispose() {
        this.scene.fog = null;
    }
}
