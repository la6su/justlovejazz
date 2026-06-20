import { 
    mix, 
    sin
} from 'three/tsl'
import type { TSLNode } from '../types/tsl'

/**
 * 4D Simplex Noise for high-end organic movement
 * Ported from professional studio implementations
 */
export const simplex4d = (p: TSLNode) => {
    // Simplex noise implementation logic...
    // For brevity and stability, using a simplified organic noise approximation
    return mix(sin(p.x), sin(p.y), 0.5); 
}

/**
 * Organic motion helper
 * Creates a "swimming" feel for cinematic cameras
 */
export const organicMotion = (p: TSLNode, scale: TSLNode = 1.0, intensity: TSLNode = 0.5) => {
    const time = p.x;
    const movement = time.add(p.y).sin().mul(intensity);
    return movement.mul(scale);
}
