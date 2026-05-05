// src/shaders/postprocessing.tsl.ts
import { 
    uv, 
    time, 
    fract, 
    sin, 
    mul, 
    add, 
    sub, 
    vec2, 
    vec3, 
    float, 
} from 'three/tsl'

export const postProcessingNode = (inputTexture: any) => {
    const u = uv()
    const t = time

    // --- 1. Chromatic Aberration ---
    // Offset based on distance from center
    const aberrationStrength = float(0.003)
    
    // In TSL, we sample textures using the .sample() method on the texture node
    // We use vec2 for UV offsets
    const colorR = inputTexture.sample(add(u, vec2(aberrationStrength, 0.0)))
    const colorG = inputTexture.sample(u)
    const colorB = inputTexture.sample(sub(u, vec2(aberrationStrength, 0.0)))
    
    // Combine the samples into a vec3 color
    const color = vec3(colorR.r, colorG.g, colorB.b)

    // --- 2. Film Grain ---
    // Pseudo-random noise based on time and UV
    // Use a simple TSL-compatible noise formula
    const noise = fract(mul(sin(add(mul(u, vec2(12.9898, 78.233)), t)), float(43758.5453)))
    const grainStrength = float(0.04)
    const grain = mul(sub(noise, float(0.5)), grainStrength)
    const colorWithGrain = add(color, grain)

    // --- 3. Vignette ---
    // Darken edges: distance from center (0.5, 0.5)
    const distFromCenter = sub(mul(u, float(2.0)), vec2(1.0, 1.0))
    const vIntensity = add(mul(distFromCenter.x, distFromCenter.x), mul(distFromCenter.y, distFromCenter.y))
    const vignette = sub(float(1.0), mul(vIntensity, float(0.4)))
    
    return mul(colorWithGrain, vignette)
}
