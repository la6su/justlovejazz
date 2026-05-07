// src/shaders/postprocessing.tsl.ts
import { 
    uv, 
    time, 
    float, 
    vec2, 
    vec3,
    Fn
} from 'three/tsl';
import { 
    applyProfessionalGrain, 
    applyCinematicVignette, 
    applySoftGlow 
} from './tsl-utils';

/**
 * Cinematic Post-Processing Node
 * Implements a professional studio-grade pipeline:
 * Chromatic Aberration -> Bloom -> Grain -> Vignette
 */
export const postProcessingNode = (inputTexture: any, params: { bloom: any, vignette: any, grain: any }) => {
    return Fn(() => {
        const u = uv();
        const t = time;

        // 1. Chromatic Aberration
        const dist = u.sub(vec2(0.5, 0.5));
        const radialWeight = dist.x.mul(dist.x).add(dist.y.mul(dist.y)).add(float(0.1));
        const aberrationStrength = float(0.005).mul(radialWeight);
        
        const colorR = inputTexture.sample(u.sub(vec2(aberrationStrength, float(0.0))));
        const colorG = inputTexture.sample(u);
        const colorB = inputTexture.sample(u.add(vec2(aberrationStrength, float(0.0))));
        
        let color = vec3(colorR.r, colorG.g, colorB.b).toVar();

        // 2. Cinematic Bloom Simulation
        const glow = applySoftGlow(inputTexture, u, params.bloom);
        color.assign(color.add(glow.mul(float(0.5))));

        // 3. Final Polish Stack
        color.assign(applyProfessionalGrain(color, u, t, params.grain));
        color.assign(applyCinematicVignette(color, u, params.vignette));

        return color;
    });
};
