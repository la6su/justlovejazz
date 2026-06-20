// Type declarations for three/webgpu Node Materials
// These materials exist at runtime (three/webgpu exports them) but @types/three doesn't cover them

import type {
  Material,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PointsMaterial,
  IridescentMaterial,
} from 'three'

declare module 'three/webgpu' {
  export class MeshBasicNodeMaterial extends Material {
    colorNode: any
    constructor(parameters?: {})
  }

  export class MeshPhysicalNodeMaterial extends MeshPhysicalMaterial {
    colorNode: any
    normalNode: any
  }

  export class MeshStandardNodeMaterial extends MeshStandardMaterial {
    colorNode: any
  }

  export class PointsNodeMaterial extends PointsMaterial {
    colorNode: any
    size: number
  }

  export class MeshIridescentNodeMaterial extends IridescentMaterial {
    colorNode: any
  }
}
