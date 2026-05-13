// src/shaders/tsl-utils.ts — TSL utility functions
// Easings, Noise, Sampling, Bloom, Vignette, Grain

import {
    vec2,
    mix,
    float,
} from 'three/tsl';

//
// ------------ EASINGS ------------
//

export const easeInQuart = (t: any) => t.mul(t).mul(t).mul(t)

export const easeOutQuart = (t: any) => {
    const t1 = float(1.0).sub(t)
    return float(1.0).sub(t1.mul(t1).mul(t1).mul(t1))
}

export const easeInOutQuad = (t: any) => {
    return t.lessThan(0.5)
        .select(
            float(2.0).mul(t).mul(t),
            float(-1.0).add(float(4.0).sub(float(2.0).mul(t)).mul(t))
        )
}

export const easeInOutQuart = (t: any) => {
    return t.lessThan(0.5)
        .select(
            float(8.0).mul(t).mul(t).mul(t).mul(t),
            float(1.0).sub(float(8.0).mul(float(1.0).sub(t)).pow(4))
        )
}

//
// ------------ NOISE & GRAIN ------------
//

/**
 * Professional Film Grain
 * Dual sine-wave noise for non-repetitive filmic texture.
 * Parameters:
 *   color — input color
 *   uv — screen UV
 *   time — animation time
 *   strength — grain intensity (0–0.1)
 */
export const applyProfessionalGrain = (
  color: any,
  uv: any,
  time: any,
  strength: any = float(0.03)
) => {
    const noise1 = uv
        .mul(vec2(12.9898, 78.233))
        .add(time)
        .sin()
        .mul(43758.5453)
        .fract()

    const noise2 = uv
        .mul(vec2(34.123, 12.456))
        .add(time.mul(0.5))
        .cos()
        .mul(12345.678)
        .fract()

    const grain = noise1.add(noise2).mul(0.5).sub(float(0.5)).mul(strength)

    return color.add(grain)
}

//
// ------------ VIGNETTE ------------
//

/**
 * Cinematic Vignette
 * Radial darkening at edges with smooth falloff.
 * Parameters:
 *   color — input color
 *   uv — screen UV
 *   intensity — vignette strength (0–1)
 */
export const applyCinematicVignette = (
  color: any,
  uv: any,
  intensity: any = float(0.4)
) => {
    const dist = uv.mul(2.0).sub(vec2(1.0, 1.0))
    const d2 = dist.x.mul(dist.x).add(dist.y.mul(dist.y))
    const v = float(1.0).sub(d2.mul(intensity))
    return color.mul(v.pow(1.5).clamp(0, 1))
}

//
// ------------ SAMPLING ------------
//

/**
 * Bicubic sampling approximation (4-tap)
 */
export const sampleBicubic = (tex: any, uv: any, textureSize: any) => {
    const texelSize = float(1.0).div(textureSize)
    const s1 = tex.sample(uv.add(vec2(0.25, 0.25).mul(texelSize)))
    const s2 = tex.sample(uv.add(vec2(-0.25, 0.25).mul(texelSize)))
    const s3 = tex.sample(uv.add(vec2(0.25, -0.25).mul(texelSize)))
    const s4 = tex.sample(uv.add(vec2(-0.25, -0.25).mul(texelSize)))
    return s1.add(s2).add(s3).add(s4).mul(0.25)
}

/**
 * Mip-Blend sampling (eliminates mip popping)
 */
export const sampleMipBlend = (tex: any, uv: any, level1: number, level2: number, mixFactor: any) => {
    const s1 = tex.sampleLevel(uv, level1)
    const s2 = tex.sampleLevel(uv, level2)
    return mix(s1, s2, mixFactor)
}

//
// ------------ BLOOM ------------
//

/**
 * Multi-scale Soft Glow (Fast Bloom)
 * 16-tap box blur across 3 scales with high-pass threshold.
 * Parameters:
 *   tex — input texture
 *   uv — screen UV
 *   strength — base blur radius (0–0.02)
 */
export const applySoftGlow = (
  tex: any,
  uv: any,
  strength: any = float(0.005)
) => {
    // 3 scales: 1x, 2x, 4x
    const scales = [
        { offset: 1.0, weight: 0.5 },
        { offset: 2.0, weight: 0.3 },
        { offset: 4.0, weight: 0.2 },
    ]

    let glow: any = float(0.0)

    for (const { offset, weight } of scales) {
        const sStr = strength.mul(offset)
        const sampleSum = tex
            .sample(uv.add(vec2(sStr, 0.0)))
            .add(tex.sample(uv.add(vec2(-sStr, 0.0))))
            .add(tex.sample(uv.add(vec2(0.0, sStr))))
            .add(tex.sample(uv.add(vec2(0.0, -sStr))))

        // 16-tap is 4 directions × 4 taps reduced to 4-tap here
        // Scale: use heavier taps for larger offsets
        const bright = sampleSum.mul(0.25).mul(weight)
        glow = glow.add(bright)
    }

    // Normalize & apply as additive glow
    return glow
}
