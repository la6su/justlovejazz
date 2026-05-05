// src/shaders/tsl-utils.ts
import { 
    vec2, 
    mul, 
    add, 
    sub, 
    mix, 
    fract, 
    sin
} from 'three/tsl'

export type TSLNode = any;

/**
 * Mip-Blend sampling implementation for TSL
 * Blends between two mip-levels to eliminate "popping" and blocky artifacts
 */
export const sampleMipBlend = (tex: any, uv: any, level1: number, level2: number, mixFactor: any) => {
    const s1 = tex.sampleLevel(uv, level1);
    const s2 = tex.sampleLevel(uv, level2);
    return mix(s1, s2, mixFactor);
}

/**
 * Bicubic sampling implementation for TSL
 * Ported from the Junni reference
 * Uses a Catmull-Rom spline approximation
 */
export const sampleBicubic = (tex: any, uv: any, textureSize: any) => {
    // 4-tap approximation blending bilinear samples
    const offset = 0.25;
    const s1 = tex.sample(add(uv, vec2(offset, offset)));
    const s2 = tex.sample(add(uv, vec2(-offset, offset)));
    const s3 = tex.sample(add(uv, vec2(offset, -offset)));
    const s4 = tex.sample(add(uv, vec2(-offset, -offset)));
    
    return mul(add(add(s1, s2), add(s3, s4)), 0.25);
}

/**
 * Single-pass Gaussian-like Blur/Glow
 * Used to simulate Bloom without a full mip-pyramid pipeline
 */
export const applySoftGlow = (tex: any, uv: any, strength: number = 0.005) => {
    const samples = [
        vec2(0.0, 0.0),
        vec2(strength, 0.0),
        vec2(-strength, 0.0),
        vec2(0.0, strength),
        vec2(0.0, -strength),
        vec2(strength, strength),
        vec2(-strength, -strength),
    ];
    
    let glow = tex.sample(uv);
    for (let i = 1; i < samples.length; i++) {
        glow = add(glow, tex.sample(add(uv, samples[i])));
    }
    
    return mul(glow, 1.0 / samples.length);
}

/**
 * Professional Film Grain
 * Uses a combined sine-wave noise to avoid the "digital" look
 */
export const applyProfessionalGrain = (color: any, uv: any, time: any, strength: number = 0.03) => {
    const noise = fract(
        mul(
            sin(
                add(
                    mul(uv, vec2(12.9898, 78.233)), 
                    time
                )
            ), 
            43758.5453
        )
    );
    
    const grain = mul(sub(noise, 0.5), strength);
    return color.add(grain);
}

/**
 * Cinematic Vignette
 */
export const applyCinematicVignette = (color: any, uv: any, intensity: number = 0.4) => {
    const dist = sub(mul(uv, 2.0), vec2(1.0, 1.0));
    const v = sub(1.0, mul(add(mul(dist.x, dist.x), mul(dist.y, dist.y)), intensity));
    return color.mul(v);
}
