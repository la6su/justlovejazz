import { 
    vec3, 
    mix, 
    smoothstep, 
    float
} from 'three/tsl'
import type { TSLNode } from '../types/tsl'

export const cinematicGridNode = (uv: TSLNode, _time: TSLNode) => {
    const gridScale = 10.0;
    const gridThickness = 0.05;
    
    const pos = uv.mul(gridScale);
    const grid = pos.add(0.5).fract().sub(0.5).abs().sub(gridThickness);
    const mask = smoothstep(0.0, 0.1, grid);
    
    return float(1.0).sub(mask);
}

export const applyHeightFog = (color: TSLNode, depth: TSLNode) => {
    const fogDensity = 0.15;
    const fogColor = vec3(0.02, 0.02, 0.05);
    
    const fogFactor = depth.mul(-1.0).mul(fogDensity);
    return mix(fogColor, color, fogFactor);
}
