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
    const currentUv = uv;
    const center = vec2(0.5, 0.5);
    const dist = distance(currentUv, center);
    
    // 1. Organic Warp: A slight bulge that increases during transition
    // Creates a "lens" effect as we dive in
    const bulge = mul(mul(progress, dist), 0.1);
    const warpUv = add(
        mul(sub(currentUv, center), add(1.0, bulge)), 
        center
    );
    
    // 2. Advanced Chromatic Aberration
    // Shift increases at the edges and peaks during the transition
    const aberrationAmount = mul(mul(progress, dist), 0.03);
    const rUv = add(warpUv, vec2(aberrationAmount, 0));
    const gUv = warpUv;
    const bUv = sub(warpUv, vec2(aberrationAmount, 0));
    
    const r = texture(tex).sample(rUv).r;
    const g = texture(tex).sample(gUv).g;
    const b = texture(tex).sample(bUv).b;
    
    let finalColor = vec3(r, g, b).toVar();
    
    // 3. Procedural Grain: Subtle high-frequency noise that intensifies during the jump
    const noise = Fn(() => {
        const t = float(0.1); // Time or seed
        const random = fract(sin(add(mul(uv, 12.9898), t)).mul(43758.5453));
        return random;
    });
    
    const grain = mul(noise(), 0.05);
    const grainIntensity = mul(progress, grain);
    
    finalColor.assign(add(finalColor, grainIntensity));
    
    return finalColor;
};
