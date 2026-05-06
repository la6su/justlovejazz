// src/shaders/project-dive.tsl.ts
import { 
    Fn, 
    uv, 
    vec2, 
    vec3, 
    distance, 
    texture, 
    add, 
    sub, 
    mul, 
    sin, 
    float, 
    fract 
} from 'three/tsl';

export const projectDiveShader = (tex: any, progress: any) => {
    const currentUv = uv();
    const center = vec2(0.5, 0.5);
    const dist = distance(currentUv, center);
    
    // 1. Organic Warp: A slight bulge that increases during transition
    // Creates a "lens" effect as we dive in
    const bulge = progress.mul(dist).mul(0.1);
    const warpUv = currentUv.sub(center).mul(1.0.add(bulge)).add(center);
    
    // 2. Advanced Chromatic Aberration
    // Shift increases at the edges and peaks during the transition
    const aberrationAmount = progress.mul(dist).mul(0.03);
    const rUv = warpUv.add(vec2(aberrationAmount, 0));
    const gUv = warpUv;
    const bUv = warpUv.sub(vec2(aberrationAmount, 0));
    
    const r = texture(tex).sample(rUv).r;
    const g = texture(tex).sample(gUv).g;
    const b = texture(tex).sample(bUv).b;
    
    let finalColor = vec3(r, g, b).toVar();
    
    // 3. Procedural Grain: Subtle high-frequency noise that intensifies during the jump
    const noise = Fn(() => {
        const t = float(0.1); // Time or seed
        const random = uv().mul(12.9898).add(t).sin().mul(43758.5453).fract();
        return random;
    });
    
    const grain = noise().mul(0.05);
    const grainIntensity = progress.mul(grain);
    
    finalColor.assign(finalColor.add(grainIntensity));
    
    return finalColor;
};
