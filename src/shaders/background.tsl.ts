// src/shaders/background.tsl.ts
import {
    color,
    sin,
    time,
    mul,
    mix,
    uniform
} from 'three/tsl'

// Uniform for scroll progress
export const uScrollProgress = uniform(0.0);
export const contrastIntensity = uniform(1.2);

export const backgroundNode = () => {
    const colorDeep = color(0x05050a);
    const colorAccent = color(0x1a1a2e);
    const colorVoid = color(0x000000);

    // const noise = (p: any, s: any) => {
    //     return sin(mul(p, s));
    // };

    const scrollMix = mix(colorDeep.toVec3(), colorAccent.toVec3(), time.mul(0.2).sin());
    
    const finalColor = colorVoid.toVec3().add(
        mix(colorDeep.toVec3(), scrollMix, contrastIntensity).mul(contrastIntensity)
    )

    return finalColor;
}
