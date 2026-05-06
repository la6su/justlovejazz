import { time, mix, uniform, vec3 } from 'three/tsl'

// Uniform for scroll progress
export const uScrollProgress = uniform(0.0);
export const contrastIntensity = uniform(1.2);

export const backgroundNode = () => {
    const colorDeep = vec3(0.02, 0.02, 0.04);
    const colorAccent = vec3(0.10, 0.10, 0.18);
    const colorVoid = vec3(0.0, 0.0, 0.0);

    const scrollMix = mix(colorDeep, colorAccent, time.mul(0.2).sin());
    
    const finalColor = colorVoid.add(
        mix(colorDeep, scrollMix, contrastIntensity).mul(contrastIntensity)
    )

    return finalColor;
}
