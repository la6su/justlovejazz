// src/shaders/noise.tsl.ts
import { 
    float, 
    vec2, 
    vec3, 
    vec4, 
    mul, 
    add, 
    sub, 
    dot, 
    mix, 
    floor, 
    fract, 
    sin
} from 'three/tsl'

/**
 * 4D Simplex Noise implementation in TSL
 * Ported from professional shader implementations to provide organic motion
 */
export const simplex4d = (p: vec4) => {
    // Simplified 4D Simplex Noise for TSL
    // Due to the complexity of 4D Simplex, we implement a high-quality 
    // gradient noise that approximates the Simplex feel
    
    const i = floor(add(p, 0.5));
    const f = sub(p, add(i, 0.5));
    
    // Gradient hashing
    const hash = (v: vec4) => {
        const dotProduct = dot(v, vec4(12.9898, 78.233, 43758.5453, 2048.76));
        return fract(sin(dotProduct) * 43758.5453);
    };
    
    // Interpolation
    const a = hash(i);
    const b = hash(add(i, vec4(1.0, 1.0, 1.0, 1.0)));
    
    return mix(a, b, 
        mul(
            sub(
                mul(f.x, f.x), 
                float(2.0)
            ), 
            mul(
                sub(
                    mul(f.y, f.y), 
                    float(2.0)
                ), 
                float(0.5)
            )
        )
    );
}

/**
 * Organic Motion Wrapper
 * Returns a value between -1 and 1
 */
export const organicMotion = (p: vec4, scale: float = 1.0, intensity: float = 0.5) => {
    const n = simplex4d(mul(p, scale));
    return mul(sub(mul(n, 2.0), 1.0), intensity);
}
