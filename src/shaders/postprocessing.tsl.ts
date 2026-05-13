// src/shaders/postprocessing.tsl.ts — Cinematic TSL Post-Processing Pipeline
// Branches: Chromatic Aberration → Bloom → Tone Map → Grain → Vignette
// All params are section-driven + quality-tier scaled, crossfaded per ft.

import {
    uv,
    time,
    float,
    vec2,
    vec3,
    Fn,
} from 'three/tsl'
import type { TSLNode, TSLTextureNode } from '../types/tsl'
import {
    applyProfessionalGrain,
    applyCinematicVignette,
    applySoftGlow,
} from './tsl-utils'

/* ---- Public interface for post-processing uniform params ---- */
export interface PostUniforms {
  bloom: number
  vignette: number
  grain: number
  chromatic: number
}

/**
 * Full TSL post-processing node.
 *
 * Pipeline (shader order):
 *  1. Chromatic Aberration (radial, distance-weighted)
 *  2. Bloom (multi-scale soft glow)
 *  3. ACES Tone Mapping
 *  4. Film Grain (time-varying)
 *  5. Vignette (radial falloff)
 */
export const postProcessingNode = (
    inputTexture: TSLTextureNode,
    params: {
      bloom: TSLNode,
      vignette: TSLNode,
      grain: TSLNode,
      chromatic: TSLNode,
    }
) => {
    return Fn(() => {
        const u = uv()
        const t = time

        // ── Step 1: Chromatic Aberration ──
        // Radial split: R shifted out, B shifted in, G stays as center
        const centerDist = u.sub(vec2(0.5, 0.5))
        const radius2 = centerDist.x.mul(centerDist.x).add(centerDist.y.mul(centerDist.y))
        const aberrationOffset = params.chromatic.mul(radius2).add(float(0.001))

        const chColorR = inputTexture.sample(u.add(centerDist.mul(aberrationOffset)))
        const chColorG = inputTexture.sample(u)
        const chColorB = inputTexture.sample(u.sub(centerDist.mul(aberrationOffset)))

        let color = vec3(chColorR.r, chColorG.g, chColorB.b).toVar()

        // ── Step 2: Bloom (multi-scale soft glow) ──
        const glow = applySoftGlow(inputTexture, u, params.bloom)
        color.assign(color.add(glow.mul(float(0.5))))

        // ── Step 3: ACES Tone Mapping ──
        // acesFitted: C * (2.51 * C + 0.03) / (1.0 + 2.43 * C)
        const acesNum = color.mul(float(6.25)).add(float(0.03))
        const acesDen = float(1.0).add(color.mul(float(4.86)))
        color.assign(acesNum.div(acesDen))

        // ── Step 4: Film Grain ──
        color.assign(applyProfessionalGrain(color, u, t, params.grain))

        // ── Step 5: Vignette ──
        color.assign(applyCinematicVignette(color, u, params.vignette))

        return color
    })
}
