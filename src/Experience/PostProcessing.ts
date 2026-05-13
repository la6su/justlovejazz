// src/Experience/PostProcessing.ts

import { postProcessingNode } from '../shaders/postprocessing.tsl.ts'
import { Experience } from './Experience'

interface PostProcessingCapableRenderer {
    setPostProcessing?: (node: unknown) => void
}

export class PostProcessing {
    constructor(experience: Experience) {
        const { renderer } = experience
        const rendererWithPost = renderer.instance as PostProcessingCapableRenderer
        
        // In WebGPURenderer, post-processing is applied via the postProcessing property
        // We create a node that takes the screen texture as input
        if (rendererWithPost.setPostProcessing) {
            rendererWithPost.setPostProcessing(postProcessingNode)
        }
    }

    destroy() {
        if (Experience.instance.renderer && Experience.instance.renderer.instance) {
            const rendererWithPost = Experience.instance.renderer.instance as PostProcessingCapableRenderer
            rendererWithPost.setPostProcessing?.(null)
        }
    }
}
