import * as THREE from 'three'
import { Noise } from '../../Utils/Noise'
import { BakuRole } from '../../core/types'

export interface BakuMaterialParams {
    color: THREE.Color
    emissive: THREE.Color
    roughness: number
    metalness: number
    role: BakuRole
}

export class Baku extends THREE.Mesh {
    private initialPosition: THREE.Vector3 = new THREE.Vector3()
    private initialRotation: THREE.Quaternion = new THREE.Quaternion()
    private time = 0
    
    private targetParams: BakuMaterialParams = {
        color: new THREE.Color(0x333333),
        emissive: new THREE.Color(0x111111),
        roughness: 0.1,
        metalness: 0.9,
        role: BakuRole.NORMAL
    }

    constructor() {
        const geometry = new THREE.IcosahedronGeometry(0.5, 3)
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff
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

        // 3. Material Morphing
        this.applyRoleAndParams()
    }

    private applyRoleAndParams() {
        if (!this.material) return;

        const role = this.targetParams.role;
        
        // Role-based Material Switching
        if (role === BakuRole.GLASS) {
            if (!(this.material instanceof THREE.MeshPhysicalMaterial)) {
                this.material = new THREE.MeshPhysicalMaterial();
            }
            const mat = this.material as THREE.MeshPhysicalMaterial;
            mat.transmission = THREE.MathUtils.lerp(mat.transmission, 1.0, 0.05);
            mat.thickness = THREE.MathUtils.lerp(mat.thickness, 0.5, 0.05);
            mat.roughness = THREE.MathUtils.lerp(mat.roughness, this.targetParams.roughness, 0.05);
        } else if (role === BakuRole.WIRE) {
            if (!(this.material instanceof THREE.MeshStandardMaterial)) {
                this.material = new THREE.MeshStandardMaterial();
            }
            (this.material as THREE.MeshStandardMaterial).wireframe = true;
        } else {
            // NORMAL or GRID
            if (!(this.material instanceof THREE.MeshStandardMaterial)) {
                this.material = new THREE.MeshStandardMaterial();
            }
            (this.material as THREE.MeshStandardMaterial).wireframe = false;
        }

        // Common params lerp
        if (this.material instanceof THREE.Material) {
            const mat = this.material as any;
            if (mat.color) mat.color.lerp(this.targetParams.color, 0.05);
            if (mat.emissive) mat.emissive.lerp(this.targetParams.emissive, 0.05);
            if (mat.roughness !== undefined) mat.roughness += (this.targetParams.roughness - mat.roughness) * 0.05;
            if (mat.metalness !== undefined) mat.metalness += (this.targetParams.metalness - mat.metalness) * 0.05;
        }
    }

    updateMaterial(params: any) {
        if (!params) return;
        
        this.targetParams = {
            role: params.role ?? this.targetParams.role,
            color: params.color instanceof THREE.Color ? params.color : new THREE.Color(params.color || 0x333333),
            emissive: params.emissive instanceof THREE.Color ? params.emissive : new THREE.Color(params.emissive || 0x111111),
            roughness: typeof params.roughness === 'number' ? params.roughness : this.targetParams.roughness,
            metalness: typeof params.metalness === 'number' ? params.metalness : this.targetParams.metalness
        };
    }
}
