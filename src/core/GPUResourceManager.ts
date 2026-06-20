import * as THREE from 'three';

type TrackableResource = THREE.Object3D | THREE.Texture | THREE.Material | THREE.WebGLRenderTarget

interface DisposableResource {
    dispose: () => void
}

interface HasGeometry {
    geometry?: {
        dispose?: () => void
    }
}

export class GPUResourceManager {
    private static instance: GPUResourceManager;
    
    // Реестр ресурсов: contextId -> Set of resources
    private resources = new Map<string, Set<TrackableResource>>();

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
    public track(contextId: string, resource: TrackableResource) {
        if (!this.resources.has(contextId)) {
            this.resources.set(contextId, new Set());
        }
        this.resources.get(contextId)!.add(resource);
    }

    /**
     * Создает RenderTarget и автоматически регистрирует его
     */
    public createRenderTarget(
        contextId: string,
        width: number,
        height: number,
        options?: THREE.RenderTargetOptions,
    ): THREE.WebGLRenderTarget {
        const rtt = new THREE.WebGLRenderTarget(width, height, options);
        this.track(contextId, rtt);
        return rtt;
    }

    /**
     * Полная очистка всех ресурсов конкретного контекста
     */
    public disposeContext(contextId: string) {
        const contextResources = this.resources.get(contextId);
        if (!contextResources) return;

        /* Disposing context */
        
        contextResources.forEach((res) => {
            this.disposeResource(res)
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

    private disposeResource(resource: TrackableResource): void {
        if (this.hasDispose(resource)) {
            resource.dispose()
        }

        if (this.hasGeometry(resource)) {
            resource.geometry?.dispose?.()
        }
    }

    private hasDispose(resource: TrackableResource): resource is TrackableResource & DisposableResource {
        return typeof (resource as DisposableResource).dispose === 'function'
    }

    private hasGeometry(resource: TrackableResource): resource is TrackableResource & HasGeometry {
        return 'geometry' in resource
    }
}
