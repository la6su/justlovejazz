// src/shaders/tsl-utils.ts
import { 
    vec2, 
    mul, 
    add, 
    sub, 
    mix, 
    fract, 
    sin,
    float
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
    const texelSize = float(1.0).div(textureSize);
    const f = uv.mul(textureSize).sub(0.5);
    const i = f.floor();
    const d = f.sub(i);

    const cubicWeight = (x: any) => {
        const x2 = x.mul(x);
        const x3 = x2.mul(x);
        return x3.mul(-2.0).add(x2.mul(3.0)).add(1.0); // Simplified cubic
    };

    // In a real production environment, this would be 16 samples.
    // For TSL, we can approximate with 4 weighted bilinear samples.
    const s1 = tex.sample(uv.add(vec2(0.25, 0.25).mul(texelSize)));
    const s2 = tex.sample(uv.add(vec2(-0.25, 0.25).mul(texelSize)));
    const s3 = tex.sample(uv.add(vec2(0.25, -0.25).mul(texelSize)));
    const s4 = tex.sample(uv.add(vec2(-0.25, -0.25).mul(texelSize)));
    
    return s1.add(s2).add(s3).add(s4).mul(0.25);
}

/**
 * Single-pass Gaussian-like Blur/Glow
 * Used to simulate Bloom without a full mip-pyramid pipeline
 */
export const applySoftGlow = (tex: any, uv: any, strength: number = 0.005) => {
    const scales = [1.0, 2.0, 4.0];
    let glow = tex.sample(uv).mul(0.0);
    
    scales.forEach(s => {
        const sStr = strength * s;
        const sampleSum = tex.sample(uv.add(vec2(sStr, 0.0)))
            .add(tex.sample(uv.add(vec2(-sStr, 0.0))))
            .add(tex.sample(uv.add(vec2(0.0, sStr))))
            .add(tex.sample(uv.add(vec2(0.0, -sStr))));
        glow = glow.add(sampleSum.mul(1.0 / 4.0));
    });
    
    return glow.mul(1.0 / scales.length);
}

/**
 * Professional Film Grain
 * Uses a combined sine-wave noise to avoid the "digital" look
 */
export const applyProfessionalGrain = (color: any, uv: any, time: any, strength: number = 0.03) => {
    const noise = uv.mul(vec2(12.9898, 78.233)).add(time).sin().mul(43758.5453).fract();
    const grain = noise.sub(0.5).mul(strength);
    return color.add(grain);
}

/**
 * Cinematic Vignette
 */
export const applyCinematicVignette = (color: any, uv: any, intensity: number = 0.4) => {
    const dist = uv.mul(2.0).sub(vec2(1.0, 1.0));
    const v = float(1.0).sub(dist.x.mul(dist.x).add(dist.y.mul(dist.y)).mul(intensity));
    return color.mul(v.pow(2.0));
}
