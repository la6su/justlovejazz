import * as THREE from 'three';

export enum QualityTier {
    LOW = 'low',
    MID = 'mid',
    ULTRA = 'ultra'
}

export type RenderMode = 'webgpu' | 'webgl' | 'unsupported';

export interface TierConfig {
    postMultiplier: number;     // Множитель интенсивности эффектов (grain, bloom)
    resolutionScale: number;    // Масштаб RTT (например, 0.5 для LOW)
    enableHeavyEffects: boolean; // Включать ли тяжелые проходы (DOF, complex blur)
    maxAnisotropy: number;      // Максимальная анизотропия фильтрации
}

const TIER_SETTINGS: Record<QualityTier, TierConfig> = {
    [QualityTier.LOW]: {
        postMultiplier: 0.5,
        resolutionScale: 0.5,
        enableHeavyEffects: false,
        maxAnisotropy: 2
    },
    [QualityTier.MID]: {
        postMultiplier: 0.8,
        resolutionScale: 0.75,
        enableHeavyEffects: true,
        maxAnisotropy: 4
    },
    [QualityTier.ULTRA]: {
        postMultiplier: 1.0,
        resolutionScale: 1.0,
        enableHeavyEffects: true,
        maxAnisotropy: 16
    }
};

export class DeviceCapability {
    private static instance: DeviceCapability;
    public readonly tier: QualityTier;
    public readonly mode: RenderMode;
    public readonly maxDpr: number;
    public readonly config: TierConfig;

    private constructor() {
        this.mode = this.detectRenderMode();
        this.tier = this.detectTier();
        this.maxDpr = this.calculateMaxDpr();
        this.config = TIER_SETTINGS[this.tier];
        console.log(`[DeviceCapability] Mode: ${this.mode} / Tier: ${this.tier.toUpperCase()} / MaxDPR: ${this.maxDpr} | Scale: ${this.config.resolutionScale}`);
    }

    public static getInstance(): DeviceCapability {
        if (!DeviceCapability.instance) {
            DeviceCapability.instance = new DeviceCapability();
        }
        return DeviceCapability.instance;
    }

    private detectRenderMode(): RenderMode {
        if (navigator.gpu) return 'webgpu';
        
        const canvas = document.createElement('canvas');
        if (canvas.getContext('webgl2')) return 'webgl';
        
        return 'unsupported';
    }

    private calculateMaxDpr(): number {
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        if (this.mode === 'webgpu') return isMobile ? 1.5 : 2;
        if (this.mode === 'webgl') return isMobile ? 1 : 1.5;
        return 1;
    }

    private detectTier(): QualityTier {
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        const cores = navigator.hardwareConcurrency || 4;
        const dpr = window.devicePixelRatio || 1;

        if (isMobile || cores <= 4 || dpr < 1.5) {
            return QualityTier.LOW;
        }
        if (cores <= 8 || dpr < 2) {
            return QualityTier.MID;
        }
        return QualityTier.ULTRA;
    }

    /**
     * Возвращает скорректированное значение интенсивности эффекта
     */
    public scaleIntensity(value: number): number {
        return value * this.config.postMultiplier;
    }

    /**
     * Проверка, разрешены ли тяжелые эффекты для текущего устройства
     */
    public canRunHeavyEffects(): boolean {
        return this.config.enableHeavyEffects;
    }
}
