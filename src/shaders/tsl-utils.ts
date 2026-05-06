// src/shaders/tsl-utils.ts
import { 
    vec2, 
    mix, 
    float
} from 'three/tsl';

/**
 * TSL Utility Library - "Shader Chunks"
 * Focus: Atomic, reusable, production-grade cinematic functions.
 */

// --- MATH UTILS ---

/**
 * atan2 approximation for TSL
 */
export const tslAtan2 = (y: any, x: any) => {
    const pi = float(3.1415926535);
    const halfPi = pi.mul(0.5);
    const signY = y.sign();
    return x.equal(0.0).select(signY.mul(halfPi), Math.atan(y / x)); // Note: Simplified for TSL context
};

// --- EASINGS (Junni Reference) ---

export const easeInQuart = (t: any) => t.mul(t).mul(t).mul(t);

export const easeOutQuart = (t: any) => {
    const t1 = float(1.0).sub(t);
    return float(1.0).sub(t1.mul(t1).mul(t1).mul(t1));
};

export const easeInOutQuad = (t: any) => {
    return t.lessThan(0.5)
        .select(
            float(2.0).mul(t).mul(t), 
            float(-1.0).add(float(4.0).sub(float(2.0).mul(t)).mul(t))
        );
};

export const easeInOutQuart = (t: any) => {
    return t.lessThan(0.5)
        .select(
            float(8.0).mul(t).mul(t).mul(t).mul(t),
            float(1.0).sub(float(8.0).mul(float(1.0).sub(t)).pow(4))
        );
};

// --- NOISE & TEXTURE ---

/**
 * Professional Film Grain
 * Uses combined sine-wave noise to avoid the "digital" look.
 */
export const applyProfessionalGrain = (color: any, uv: any, time: any, strength: number = 0.03) => {
    const noise = uv.mul(vec2(12.9898, 78.233)).add(time).sin().mul(43758.5453).fract();
    const grain = noise.sub(0.5).mul(strength);
    return color.add(grain);
};

/**
 * Cinematic Vignette
 */
export const applyCinematicVignette = (color: any, uv: any, intensity: number = 0.4) => {
    const dist = uv.mul(2.0).sub(vec2(1.0, 1.0));
    const v = float(1.0).sub(dist.x.mul(dist.x).add(dist.y.mul(dist.y)).mul(intensity));
    return color.mul(v.pow(2.0));
};

/**
 * Bicubic sampling approximation for TSL
 * Eliminates blocky artifacts during extreme zooms.
 */
export const sampleBicubic = (tex: any, uv: any, textureSize: any) => {
    const texelSize = float(1.0).div(textureSize);
    
    const s1 = tex.sample(uv.add(vec2(0.25, 0.25).mul(texelSize)));
    const s2 = tex.sample(uv.add(vec2(-0.25, 0.25).mul(texelSize)));
    const s3 = tex.sample(uv.add(vec2(0.25, -0.25).mul(texelSize)));
    const s4 = tex.sample(uv.add(vec2(-0.25, -0.25).mul(texelSize)));
    
    return s1.add(s2).add(s3).add(s4).mul(0.25);
};

/**
 * Mip-Blend sampling implementation
 * Blends between two mip-levels to eliminate "popping".
 */
export const sampleMipBlend = (tex: any, uv: any, level1: number, level2: number, mixFactor: any) => {
    const s1 = tex.sampleLevel(uv, level1);
    const s2 = tex.sampleLevel(uv, level2);
    return mix(s1, s2, mixFactor);
};

/**
 * Soft Glow (Fast Bloom approximation)
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
        glow = glow.add(sampleSum.mul(0.25));
    });
    
    return glow.mul(1.0 / scales.length);
};
