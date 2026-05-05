// src/shaders/postprocessing.tsl.ts
import { 
    uv, 
    time, 
    float, 
    vec2, 
    vec3, 
    sub
} from 'three/tsl'
import { applyProfessionalGrain, applyCinematicVignette, applySoftGlow } from './tsl-utils'

export const postProcessingNode = (inputTexture: any) => {
    const u = uv as any
    const t = time as any

    // --- 1. Base Layer with Chromatic Aberration ---
    const aberrationStrength = float(0.003)
    const colorR = inputTexture.sample(add(u, vec2(aberrationStrength, 0.0)))
    const colorG = inputTexture.sample(u)
    const colorB = inputTexture.sample(sub(u, vec2(aberrationStrength, 0.0)))
    
    let color = vec3(colorR.r, colorG.g, colorB.b).toVar()
    
    // --- 2. Cinematic Bloom Simulation ---
    // We blend the original color with a blurred version to create a "glow"
    const glow = applySoftGlow(inputTexture, u, float(0.006))
    color.assign(color.add(glow.mul(float(0.4))))
    
    // --- 3. Final Polish Stack ---
    
    // Grain
    color.assign(applyProfessionalGrain(color, u, t, float(0.04)))
    
    // Vignette
    color.assign(applyCinematicVignette(color, u, float(0.4)))
    
    return color
}
