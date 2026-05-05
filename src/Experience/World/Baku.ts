// src/Experience/Projects/Baku.ts
import * as THREE from 'three'
import { Noise } from '../../Utils/Noise'

export interface BakuMaterialParams {
    color: THREE.Color
    emissive: THREE.Color
    roughness: number
    metalness: number
}

export class Baku extends THREE.Mesh {
    private initialPosition: THREE.Vector3 = new THREE.Vector3()
    private initialRotation: THREE.Quaternion = new THREE.Quaternion()
    private time = 0
    
    private targetParams: BakuMaterialParams = {
        color: new THREE.Color(0x333333),
        emissive: new THREE.Color(0x111111),
        roughness: 0.1,
        metalness: 0.9
    }

    constructor() {
        const geometry = new THREE.IcosahedronGeometry(0.5, 15)
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            metalness: 0.9, 
            roughness: 0.1,
            emissive: 0x111111
        })
        super(geometry, material)
        
        this.initialPosition.copy(this.position)
        this.initialRotation.copy(this.quaternion)
    }
    
    update(delta: number) {
        this.time += delta
        
        // 1. Organic Position Drift
        const driftX = Noise.organicValue(this.time, 10, 0.5, 0.1)
        const driftY = Noise.organicValue(this.time, 20, 0.7, 0.1)
        const driftZ = Noise.organicValue(this.time, 30, 0.3, 0.1)
        
        this.position.x += driftX * delta
        this.position.y += driftY * delta
        this.position.z += driftZ * delta
        
        // 2. Organic Rotation (Gentle sway)
        const swayX = Noise.organicValue(this.time, 40, 0.2, 0.01)
        const swayY = Noise.organicValue(this.time, 50, 0.3, 0.01)
        
        this.rotation.x += swayX
        this.rotation.y += swayY

        // 3. Material Morphing (Smooth lerp to target)
        const mat = this.material as THREE.MeshStandardMaterial
        mat.color.lerp(this.targetParams.color, 0.05)
        mat.emissive.lerp(this.targetParams.emissive, 0.05)
        mat.roughness += (this.targetParams.roughness - mat.roughness) * 0.05
        mat.metalness += (this.targetParams.metalness - mat.metalness) * 0.05
    }

    updateMaterial(params: BakuMaterialParams) {
        this.targetParams = params
    }
}
