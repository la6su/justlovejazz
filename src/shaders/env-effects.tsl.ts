// src/shaders/env-effects.tsl.ts
import { 
    vec3, 
    mul, 
    add, 
    sub, 
    sin, 
    fract, 
    abs, 
    mix, 
    smoothstep, 
    length,
    exp
} from 'three/tsl'

/**
 * Procedural Cinematic Grid Node
 * Returns a TSL node for the grid color
 */
export const cinematicGridNode = (color: any, time: any, uv: any) => {
    // Scale and shift grid
    const gridScale = 10.0;
    const shiftedUv = mul(uv, gridScale) as any;
    
    // Create lines using the "thin line" trick
    const lineWeight = 0.02;
    const gridX = sub(1.0, smoothstep(0.0, lineWeight, abs(sub(fract(shiftedUv.x), 0.5))));
    const gridY = sub(1.0, smoothstep(0.0, lineWeight, abs(sub(fract(shiftedUv.y), 0.5))));
    const grid = add(gridX, gridY);
    
    // Pulsing effect
    const pulse = mul(sin(add(time, mul(shiftedUv.x, 0.1))), 0.2);
    const finalGrid = add(grid, pulse);
    
    // Distance fade
    const dist = length(sub(uv, 0.5));
    const fade = smoothstep(0.5, 0.2, dist);
    
    return mul(color, mul(finalGrid, fade));
}

/**
 * TSL Height Fog
 * Simulates exponential height fog for depth
 */
export const applyHeightFog = (color: any, distance: any, density: number = 0.05) => {
    const fogFactor = exp(mul(distance, -density));
    return mix(color, vec3(0.05, 0.05, 0.1), sub(1.0, fogFactor));
}
