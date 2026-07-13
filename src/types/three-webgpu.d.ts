declare module 'three/webgpu' {
  import type {
    Material,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    PointsMaterial,
    Color,
  } from 'three'

  // ── WebGPU Renderer ──
  export interface WebGPURendererParameters {
    antialias?: boolean
    alpha?: boolean
    anisotropy?: number
    xrSupport?: boolean
  }

  export class WebGPURenderer {
    constructor(parameters?: WebGPURendererParameters)
    render(scene: any, camera: any): void
    setSize(width: number, height: number): void
    setPixelRatio(value: number): void
    dispose(): void
    domElement: HTMLCanvasElement
  }

  // ── TSL Render Pipeline (post-processing) ──
  export class PassNode {
    constructor(scene: any, camera: any)
    getTextureNode(name?: string): any
    setMRT(mrt: any): void
  }

  export class RenderPipeline {
    constructor(renderer: WebGPURenderer, outputNode?: any)
    outputNode: any
    render(): void
    renderAsync(): Promise<void>
    dispose(): void
    setSize(width: number, height: number): void
  }

  // ── Node materials ──
  export class MeshBasicNodeMaterial extends Material {
    constructor(parameters?: {})
    colorNode: any
    positionNode: any
  }

  export class MeshPhysicalNodeMaterial extends MeshPhysicalMaterial {
    constructor(parameters?: {})
    colorNode: any
    normalNode: any
    transparent: boolean
    transmission: number
    thickness: number
  }

  export class MeshStandardNodeMaterial extends MeshStandardMaterial {
    constructor(parameters?: {})
    colorNode: any
    transparent: boolean
    wireframe: boolean
    side: number
  }

  export class PointsNodeMaterial extends PointsMaterial {
    constructor(parameters?: {})
    colorNode: any
    size: number
    transparent: boolean
    blending: number
    sizeAttenuation: boolean
  }

  export class SpriteNodeMaterial extends Material {
    constructor(parameters?: {})
    colorNode: any
    positionNode: any
    rotationNode: any
    scaleNode: any
    transparent: boolean
    sizeAttenuation: boolean
    fog: boolean
  }
}
