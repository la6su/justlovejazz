export type RendererMode = 'webgpu' | 'webgl' | 'unsupported'
export type QualityTier = 'high' | 'medium' | 'low'

export interface RendererCapabilities {
    mode: RendererMode
    tier: QualityTier
    maxDpr: number
    postProcessing: boolean
    floatRenderTargets: boolean
}
