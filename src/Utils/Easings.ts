// src/Utils/Easings.ts
export const Easings = {
    linear: (t: number) => t,
    
    easeInQuart: (t: number) => t * t * t * t,
    
    easeOutQuart: (t: number) => {
        const t1 = t - 1;
        return 1 - t1 * t1 * t1 * t1;
    },
    
    easeInOutQuad: (t: number) => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    
    easeInOutQuart: (t: number) => {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * Math.pow(t - 1, 4);
    },
    
    easeInOutCubic: (t: number) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    
    sigmoid: (x: number) => {
        const weight = 6.0;
        const e1 = Math.exp(-weight * (2 * x - 1));
        const e2 = Math.exp(-weight);
        return (1.0 + (1.0 - e1) / (1.0 + e1) * (1.0 + e2) / (1.0 - e2)) / 2.0;
    }
};
