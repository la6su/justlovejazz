import { 
    vec3, 
    mul, 
    add, 
    sub, 
    fract, 
    abs, 
    mix, 
    smoothstep, 
    exp
} from 'three/tsl'

export const cinematicGridNode = (uv: any, time: any) => {
    const gridScale = 10.0;
    const gridThickness = 0.05;
    
    const pos = mul(uv, gridScale);
    const grid = sub(abs(sub(fract(add(pos, 0.5)), 0.5)), gridThickness);
    const mask = smoothstep(0.0, 0.1, grid);
    
    return sub(1.0, mask);
}

export const applyHeightFog = (color: any, depth: any) => {
    const fogDensity = 0.15;
    const fogColor = vec3(0.02, 0.02, 0.05);
    
    const fogFactor = exp(mul(mul(depth, -1.0), fogDensity));
    return mix(fogColor, color, fogFactor);
}
