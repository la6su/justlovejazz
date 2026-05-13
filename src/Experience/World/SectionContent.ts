// src/Experience/World/SectionContent.ts — 3D content per section
import * as THREE from 'three';
import { NarrativePhase } from '../../core/types';

/**
 * Creates 3D content for each section phase.
 * Content transitions smoothly between sections.
 */
export class SectionContent {
    /**
     * AWAKENING (0–0.2): Abstract forms, floating particles
     */
    static createAwakeningContent(): THREE.Object3D[] {
        const objects: THREE.Object3D[] = [];

        // Floating rings
        const ringGeometry = new THREE.TorusGeometry(2, 0.02, 16, 100);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            emissive: 0x111122,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.6,
        });

        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(ringGeometry, ringMaterial.clone());
            ring.rotation.x = Math.PI / 2;
            ring.rotation.y = (Math.PI * 2 / 3) * i;
            ring.scale.setScalar(1 + i * 0.5);
            ring.userData.type = 'floating-ring';
            ring.userData.phase = NarrativePhase.AWAKENING;
            objects.push(ring);
        }

        // Ambient particles
        const particleCount = 500;
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.02,
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
        });
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particles.userData.type = 'particles';
        particles.userData.phase = NarrativePhase.AWAKENING;
        objects.push(particles);

        return objects;
    }

    /**
     * DISCOVERY (0.2–0.5): Project cards appear, wireframe structures
     */
    static createDiscoveryContent(): THREE.Object3D[] {
        const objects: THREE.Object3D[] = [];

        // Wireframe grid structure
        const gridGeo = new THREE.PlaneGeometry(6, 6, 12, 12);
        const gridMat = new THREE.MeshBasicMaterial({
            color: 0x444444,
            wireframe: true,
            transparent: true,
            opacity: 0.2,
        });
        const grid = new THREE.Mesh(gridGeo, gridMat);
        grid.rotation.x = -Math.PI / 2;
        grid.position.y = -2;
        grid.userData.type = 'wireframe-grid';
        grid.userData.phase = NarrativePhase.DISCOVERY;
        objects.push(grid);

        // Floating cubes (project indicators)
        const cubeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const cubeMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            emissive: 0x112244,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.7,
        });

        for (let i = 0; i < 8; i++) {
            const cube = new THREE.Mesh(cubeGeo, cubeMat.clone());
            cube.position.set(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3
            );
            cube.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            cube.userData.type = 'floating-cube';
            cube.userData.phase = NarrativePhase.DISCOVERY;
            objects.push(cube);
        }

        return objects;
    }

    /**
     * DEEP_DIVE (0.5–0.8): Immersive gallery, technical elements
     */
    static createDeepDiveContent(): THREE.Object3D[] {
        const objects: THREE.Object3D[] = [];

        // Central orb / focal point
        const orbGeo = new THREE.SphereGeometry(0.5, 32, 32);
        const orbMat = new THREE.MeshPhysicalMaterial({
            color: 0x001122,
            emissive: 0x001133,
            roughness: 0.0,
            metalness: 1.0,
            transmission: 0.8,
            thickness: 0.5,
            transparent: true,
            opacity: 0.8,
        });
        const orb = new THREE.Mesh(orbGeo, orbMat);
        orb.userData.type = 'central-orb';
        orb.userData.phase = NarrativePhase.DEEP_DIVE;
        objects.push(orb);

        // Parameter lines
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.3,
        });

        for (let i = 0; i < 20; i++) {
            const points: THREE.Vector3[] = [];
            const angle = (Math.PI * 2 / 20) * i;
            const radius = 2 + Math.random();

            for (let j = 0; j <= 20; j++) {
                const t = j / 20;
                points.push(new THREE.Vector3(
                    Math.cos(angle) * radius * (1 - t),
                    Math.sin(t * Math.PI) * 2 - 1,
                    Math.sin(angle) * radius * (1 - t)
                ));
            }

            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeo, lineMat);
            line.userData.type = 'parametric-line';
            line.userData.phase = NarrativePhase.DEEP_DIVE;
            objects.push(line);
        }

        return objects;
    }

    /**
     * CONNECTION (0.8–1.0): Minimal, clean, message-focused
     */
    static createConnectionContent(): THREE.Object3D[] {
        const objects: THREE.Object3D[] = [];

        // Single large ring / halo
        const haloGeo = new THREE.TorusGeometry(3, 0.03, 8, 100);
        const haloMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            emissive: 0x222222,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.6,
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.rotation.x = Math.PI / 2;
        halo.userData.type = 'halo';
        halo.userData.phase = NarrativePhase.CONNECTION;
        objects.push(halo);

        // Minimal particles
        const count = 200;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 3 + Math.random() * 2;
            const theta = Math.random() * Math.PI * 2;
            positions[i * 3] = Math.cos(theta) * r;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = Math.sin(theta) * r;
        }

        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            size: 0.015,
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        particles.userData.type = 'particles';
        particles.userData.phase = NarrativePhase.CONNECTION;
        objects.push(particles);

        return objects;
    }
}