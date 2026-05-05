// src/Experience/PostProcessing.ts
import * as THREE from 'three'
import { postProcessingNode } from '../shaders/postprocessing.tsl.ts'
import { Experience } from './Experience'

export class PostProcessing {
    constructor() {
        const { renderer } = Experience.instance
        
        // In WebGPURenderer, post-processing is applied via the postProcessing property
        // We create a node that takes the screen texture as input
        if (renderer.instance && renderer.instance.setPostProcessing) {
            renderer.instance.setPostProcessing(postProcessingNode)
        }
    }

    destroy() {
        if (Experience.instance.renderer && Experience.instance.renderer.instance) {
            Experience.instance.renderer.instance.setPostProcessing(null)
        }
    }
}
