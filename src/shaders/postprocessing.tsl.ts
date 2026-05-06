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
    const u = uv();
    const t = time;

    // --- 1. Base Layer with Chromatic Aberration ---
    const aberrationStrength = float(0.003);
    const colorR = inputTexture.sample(u.sub(vec2(-aberrationStrength, 0.0)));
    const colorG = inputTexture.sample(u);
    const colorB = inputTexture.sample(u.sub(vec2(aberrationStrength, 0.0)));
    
    let color = vec3(colorR.r, colorG.g, colorB.b).toVar();
    
    // --- 2. Cinematic Bloom Simulation ---
    const glow = applySoftGlow(inputTexture, u, 0.006);
    color.assign(color.add(glow.mul(float(0.4))));
    
    // --- 3. Final Polish Stack ---
    color.assign(applyProfessionalGrain(color, u, t, 0.04));
    color.assign(applyCinematicVignette(color, u, 0.4));
    
    return color;
}
