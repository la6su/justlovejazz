// src/shaders/background.tsl.ts
import {
    color,
    sin,
    cos,
    time,
    uv,
    add,
    mul,
    sub,
    float,
    mix,
    fract,
    vec2,
    uniform
} from 'three/tsl'

// Uniform for scroll progress to make the background react to the user
export const uScrollProgress = uniform(0.0)

export const backgroundNode = () => {
    const t = time
    const u = uv()

    // High-contrast noise function
    const noise = (p: any, s: any) => {
        const x = add(mul(p.x, float(3.0)), mul(t, s))
        const y = add(mul(p.y, float(3.0)), mul(t, mul(s, float(0.7))))
        return add(sin(x), sin(add(y, sin(x))))
    }

    // Domain Warping for "Liquid" feel
    const warp1 = noise(u, float(0.2))
    const offset = vec2(mul(warp1, float(0.2)), mul(warp1, float(0.2)))
    const warpedUv = add(u, offset)
    const warp2 = noise(warpedUv, float(0.5))

    // Contrast enhancement: use pow() or multiplication to sharpen the light/dark areas
    // Avoid using JS operators like '*' or '-' with TSL nodes
    const intensity = mul(float(0.5), add(warp2, float(1.0)))
    const contrastIntensity = mul(intensity, intensity) // Square for higher contrast

    // Color Palette: Deep Void -> Electric Accents
    const colorVoid = color(0.01, 0.01, 0.02)
    const colorDeep = color(0.05, 0.02, 0.15)
    const colorBright = color(0.8, 0.2, 0.5) // Magenta/Red accent
    const colorAccent = color(0.0, 0.7, 0.9) // Cyan accent

    // Mix colors based on scroll progress and intensity
    const scrollMix = mix(colorBright, colorAccent, uScrollProgress)
    
    const finalColor = add(
        colorVoid,
        mul(mix(colorDeep, scrollMix, contrastIntensity), contrastIntensity)
    )

    // Vignette: darken the edges to make text more readable and center the focus
    // Calculate distance from center (0.5, 0.5)
    const dx = sub(mul(u.x, float(-1.0)), float(-0.5)) // simplified center offset
    const dy = sub(mul(u.y, float(-1.0)), float(-0.5))
    
    // Let's use a more robust distance calc to avoid NaN
    const distSq = add(mul(sub(u.x, float(0.5)), sub(u.x, float(0.5))), 
                       mul(sub(u.y, float(0.5)), sub(u.y, float(0.5))))
    
    const vignette = sub(float(1.0), mul(distSq, float(0.8)))
    
    return mul(finalColor, vignette)
}
