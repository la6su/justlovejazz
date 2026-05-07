import * as THREE from 'three';

export class WorldAtmosphere {
    private scene: THREE.Scene;
    private points!: THREE.Points;
    private particleMaterial!: THREE.PointsMaterial;
    private particleGeometry!: THREE.BufferGeometry;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.initFog();
        this.initParticles();
    }

    private initFog() {
        // Initial fog setup is handled by the World state machine via setFog
    }

    private initParticles() {
        const count = 5000;
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 20;
            velocities[i] = (Math.random() - 0.5) * 0.01;
        }

        this.particleGeometry = new THREE.BufferGeometry();
        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        this.particleMaterial = new THREE.PointsMaterial({
            size: 0.015,
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.points = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.scene.add(this.points);
    }

    public setFog(color: THREE.Color, density: number) {
        this.scene.fog = new THREE.FogExp2(color, density);
    }

    public update(time: number) {
        const positions = this.particleGeometry.attributes.position.array as Float32Array;
        const velocities = this.particleGeometry.attributes.velocity.array as Float32Array;

        for (let i = 0; i < positions.length; i++) {
            positions[i] += velocities[i] * 0.1;
            
            // Boundary wrap
            if (Math.abs(positions[i]) > 10) {
                positions[i] *= -0.9;
            }
        }

        this.particleGeometry.attributes.position.needsUpdate = true;

        // Subtle rotation of the whole particle cloud for organic feel
        this.points.rotation.y = time * 0.02;
        this.points.rotation.x = time * 0.01;
    }

    public dispose() {
        this.scene.remove(this.points);
        this.particleGeometry.dispose();
        this.particleMaterial.dispose();
    }
}
