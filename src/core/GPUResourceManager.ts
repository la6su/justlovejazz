import * as THREE from 'three';

export class GPUResourceManager {
    private static instance: GPUResourceManager;
    
    // Реестр ресурсов: contextId -> Set of resources
    private resources = new Map<string, Set<THREE.Object3D | THREE.Texture | THREE.Material | THREE.WebGLRenderTarget>>();

    private constructor() {}

    public static getInstance(): GPUResourceManager {
        if (!GPUResourceManager.instance) {
            GPUResourceManager.instance = new GPUResourceManager();
        }
        return GPUResourceManager.instance;
    }

    /**
     * Регистрирует ресурс для последующей автоматической очистки
     */
    public track(contextId: string, resource: THREE.Object3D | THREE.Texture | THREE.Material | THREE.WebGLRenderTarget) {
        if (!this.resources.has(contextId)) {
            this.resources.set(contextId, new Set());
        }
        this.resources.get(contextId)!.add(resource);
    }

    /**
     * Создает RenderTarget и автоматически регистрирует его
     */
    public createRenderTarget(contextId: string, options: THREE.WebGLRenderTargetOptions): THREE.WebGLRenderTarget {
        const rtt = new THREE.WebGLRenderTarget(options);
        this.track(contextId, rtt);
        return rtt;
    }

    /**
     * Полная очистка всех ресурсов конкретного контекста
     */
    public disposeContext(contextId: string) {
        const contextResources = this.resources.get(contextId);
        if (!contextResources) return;

        console.log(`[GPUResourceManager] Disposing context: ${contextId} (${contextResources.size} resources)`);
        
        contextResources.forEach(res => {
            if (res.dispose) {
                res.dispose();
            }
            if ((res as any).geometry?.dispose) {
                (res as any).geometry.dispose();
            }
        });

        this.resources.delete(contextId);
    }

    /**
     * Экстренная очистка всех ресурсов (например, при потере контекста WebGL)
     */
    public disposeAll() {
        const contexts = Array.from(this.resources.keys());
        contexts.forEach(id => this.disposeContext(id));
    }
}
