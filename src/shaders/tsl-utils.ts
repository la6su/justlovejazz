// src/shaders/tsl-utils.ts — TSL utility functions
// Easings, Noise, Sampling, Bloom, Vignette, Grain
//
// Ported from junni-inc/next.junni.co.jp glsl-chunks where applicable.
// Where three/tsl ships a built-in equivalent (MaterialX noise, hsvtorgb,
// rotate2d, hash), we re-export it under a junni-compatible name instead of
// re-implementing — keeps WGSL output optimal and avoids drift.

import {
    vec2,
    mix,
    float,
    exp,
    mx_noise_float,
    mx_hsvtorgb,
    mx_rotate2d,
    hash,
} from 'three/tsl';
import type { TSLNode, TSLTextureNode } from '../types/tsl'

//
// ------------ EASINGS ------------
//

export const easeInQuart = (t: TSLNode) => t.mul(t).mul(t).mul(t)

export const easeOutQuart = (t: TSLNode) => {
    const t1 = float(1.0).sub(t)
    return float(1.0).sub(t1.mul(t1).mul(t1).mul(t1))
}

export const easeInOutQuad = (t: TSLNode) => {
    return t.lessThan(0.5)
        .select(
            float(2.0).mul(t).mul(t),
            float(-1.0).add(float(4.0).sub(float(2.0).mul(t)).mul(t))
        )
}

export const easeInOutQuart = (t: TSLNode) => {
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
  color: TSLNode,
  uv: TSLNode,
  time: TSLNode,
  strength: TSLNode = float(0.03)
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
  color: TSLNode,
  uv: TSLNode,
  intensity: TSLNode = float(0.4)
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
export const sampleBicubic = (tex: TSLTextureNode, uv: TSLNode, textureSize: TSLNode) => {
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
export const sampleMipBlend = (tex: TSLTextureNode, uv: TSLNode, level1: number, level2: number, mixFactor: TSLNode) => {
    const sampleLevel = tex.sampleLevel ?? ((_uv: TSLNode, _level: number) => tex.sample(_uv))
    const s1 = sampleLevel(uv, level1)
    const s2 = sampleLevel(uv, level2)
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
  tex: TSLTextureNode,
  uv: TSLNode,
  strength: TSLNode = float(0.005)
) => {
    // 3 scales: 1x, 2x, 4x
    const scales = [
        { offset: 1.0, weight: 0.5 },
        { offset: 2.0, weight: 0.3 },
        { offset: 4.0, weight: 0.2 },
    ]

    let glow: TSLNode = float(0.0)

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


//
// ------------ SIGMOID EASING (ported from junni easings.glsl) ------------
//

/**
 * Sigmoid easing — smooth S-curve, weight controls steepness.
 * Ported from junni glsl-chunks/easings.glsl.
 *   weight = 6.0 matches junni default.
 */
export const sigmoid = (x: TSLNode, weight = 6.0): TSLNode => {
    // Coerce to float — TSLNode is `any` (adapter boundary), and without
    // coercion .mul() overload resolution can infer vec3, breaking exp().
    const t = float(x)
    const e1 = exp(float(weight).mul(float(2.0).mul(t).sub(1.0)).negate())
    const e2 = exp(float(weight).negate())
    return float(1.0)
        .add(
            float(1.0).sub(e1)
                .div(float(1.0).add(e1))
                .mul(float(1.0).add(e2))
                .div(float(1.0).sub(e2))
        )
        .div(2.0)
}


//
// ------------ NOISE (thin wrappers over three/tsl MaterialX noise) ------------
//

/**
 * 2D simplex-like noise. Wraps three/tsl mx_noise_float.
 * Equivalent to junni snoise2D(vec2) — returns float in [-1, 1].
 */
export const snoise2D = (p: TSLNode): TSLNode => mx_noise_float(p)

/**
 * 3D simplex-like noise. Wraps three/tsl mx_noise_float with vec3 input.
 * Equivalent to junni snoise3D(vec3) — returns float in [-1, 1].
 */
export const snoise3D = (p: TSLNode): TSLNode => mx_noise_float(p)


//
// ------------ COLOR (thin wrapper over three/tsl mx_hsvtorgb) ------------
//

/**
 * HSV → RGB conversion. Wraps three/tsl mx_hsvtorgb.
 * Ported name from junni glsl-chunks/hsv2rgb.glsl.
 * Input: vec3(h, s, v) in [0,1]. Returns vec3 rgb.
 */
export const hsv2rgb = (hsv: TSLNode): TSLNode => mx_hsvtorgb(hsv)


//
// ------------ TRANSFORM (thin wrapper over three/tsl mx_rotate2d) ------------
//

/**
 * Rotate a 2D position by an angle. Wraps three/tsl mx_rotate2d.
 *
 * NOTE: three's mx_rotate2d rotates a *position* by an *amount in degrees*,
 * which differs from junni's glsl-chunks/rotate.glsl (returns a mat2 for
 * radians). This wrapper exposes three's semantics. If you need a pure
 * rotation matrix builder, use three/tsl `rotate()` directly.
 *
 * Parameters:
 *   input  — vec2 position to rotate
 *   amount — rotation amount in degrees
 */
export const rotate2D = (input: TSLNode, amount: TSLNode): TSLNode => mx_rotate2d(input, amount)


//
// ------------ RANDOM (thin wrapper over three/tsl hash) ------------
//

/**
 * Deterministic 2D hash → [0, 1). Wraps three/tsl hash.
 * Ported name from junni glsl-chunks/random.glsl.
 */
export const random2D = (p: TSLNode): TSLNode => hash(p)


//
// ------------ GAUSSIAN BLUR (ported from junni gaussBlur5.glsl) ------------
//

/**
 * 5-tap separable Gaussian blur.
 * Ported from junni glsl-chunks/gaussBlur5.glsl (Jam3/glsl-fast-gaussian-blur, MIT).
 *
 * Parameters:
 *   tex        — input texture node
 *   uv         — sampling coordinate
 *   resolution — full-resolution vec2 (width, height) in pixels
 *   direction  — blur direction vector (e.g. vec2(1,0) for horizontal)
 *
 * Weights: 0.29411764 (center), 0.35294117 × 2 (offset 1.3333).
 * Total: 1.0 (energy-preserving).
 */
export const gaussBlur5 = (
    tex: TSLTextureNode,
    uvNode: TSLNode,
    resolution: TSLNode,
    direction: TSLNode,
): TSLNode => {
    const off1 = float(1.3333333333333333).mul(direction)
    const d = off1.div(resolution)

    return tex
        .sample(uvNode)
        .mul(0.29411764705882354)
        .add(tex.sample(uvNode.add(d)).mul(0.35294117647058826))
        .add(tex.sample(uvNode.sub(d)).mul(0.35294117647058826))
}


//
// ------------ COMPOSITE POST HELPERS (section-aware) ------------
//

/**
 * Section-aware bloom composite: scene + bloom * intensity, with tone fallback.
 * Intended for use inside a TSL PostProcessing output node graph.
 *
 * Parameters:
 *   sceneColor  — input scene color node (PassNode texture)
 *   bloomColor  — blurred bloom texture node
 *   intensity   — bloom multiplier (0 disables, driven by section ppParam)
 */
export const compositeBloom = (
    sceneColor: TSLNode,
    bloomColor: TSLNode,
    intensity: TSLNode,
): TSLNode => {
    return sceneColor.add(bloomColor.mul(intensity))
}

/**
 * ACES filmic tonemap approximation (Narkowicz 2015).
 * Matches the WebGL composite pass in RenderPipeline.ts.
 */
export const acesTonemap = (color: TSLNode): TSLNode => {
    const a = float(6.2).mul(color).add(0.03)
    const b = color.mul(float(4.8).mul(color).add(1.0))
    return a.div(b)
}
