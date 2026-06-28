// src/core/AssetManager.ts
import * as THREE from 'three';
import type { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { DeviceCapability } from './DeviceCapability';

/**
 * VRAM-Aware Asset Manager
 * Handles lifecycle of Textures, Geometries, and Materials to prevent memory leaks.
 */
export class AssetManager {
  private static instance: AssetManager;
  
  private textureCache: Map<string, THREE.Texture> = new Map();
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  private materialCache: Map<string, THREE.Material> = new Map();
  
  // Group assets by "context" (e.g., 'intro', 'gallery', 'project-1') for easy bulk disposal
  private contextGroups: Map<string, Set<THREE.Object3D | THREE.Texture | THREE.Material | THREE.BufferGeometry>> = new Map();

  private ktx2Loader: KTX2Loader | null = null;
  private textureLoader: THREE.TextureLoader;

  private constructor() {
    this.textureLoader = new THREE.TextureLoader();
  }

  /** Lazily create the KTX2Loader (and its 2 web workers) only when a .ktx2
   *  texture is first requested. Avoids pulling the ~622 KB basis transcoder
   *  into the main bundle when no KTX2 textures are used (currently none). */
  private async getKtx2Loader(): Promise<KTX2Loader> {
    if (this.ktx2Loader) return this.ktx2Loader;
    const { KTX2Loader } = await import('three/addons/loaders/KTX2Loader.js');
    const loader = new KTX2Loader();
    loader.setWorkerLimit(2);
    loader.setTranscoderPath('/basis/');
    this.ktx2Loader = loader;
    return loader;
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Register an asset to a specific context for later bulk disposal.
   */
  public registerToContext(context: string, asset: THREE.Object3D | THREE.Texture | THREE.Material | THREE.BufferGeometry): void {
    if (!this.contextGroups.has(context)) {
      this.contextGroups.set(context, new Set());
    }
    this.contextGroups.get(context)!.add(asset);
  }

  /**
   * Loads a texture with VRAM optimization.
   */
  public async loadTexture(url: string, context?: string): Promise<THREE.Texture> {
    if (this.textureCache.has(url)) {
      const tex = this.textureCache.get(url)!;
      if (context) this.registerToContext(context, tex);
      return tex;
    }

    let texture: THREE.Texture;
    try {
      texture = url.endsWith('.ktx2')
        ? await (await this.getKtx2Loader()).loadAsync(url)
        : await this.textureLoader.loadAsync(url);

      if (texture.isTexture) {
        // Three.js 184+: BicubicFilter not exported; use standard mipmap filters with linear sampling
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = DeviceCapability.getInstance().config.maxAnisotropy;
      }
    } catch (e) {
      console.error(`AssetManager: Failed to load texture ${url}`, e);
      texture = new THREE.DataTexture(new Uint8Array([0,0,0,0]), 1, 1);
    }

    this.textureCache.set(url, texture);
    if (context) this.registerToContext(context, texture);
    return texture;
  }

  /**
   * Load/Cache Geometry.
   */
  public cacheGeometry(id: string, geometry: THREE.BufferGeometry, context?: string): THREE.BufferGeometry {
    this.geometryCache.set(id, geometry);
    if (context) this.registerToContext(context, geometry);
    return geometry;
  }

  /**
   * Load/Cache Material.
   */
  public cacheMaterial(id: string, material: THREE.Material, context?: string): THREE.Material {
    this.materialCache.set(id, material);
    if (context) this.registerToContext(context, material);
    return material;
  }

  /**
   * Full disposal of a specific context.
   * CRITICAL for Cinematic experiences with high-res assets.
   */
    public disposeContext(context: string): void {
        const assets = this.contextGroups.get(context);
        if (!assets) return;

        assets.forEach(asset => {
            this.disposeAsset(asset);
        });

        this.contextGroups.delete(context);
    }

    private disposeAsset(asset: THREE.Object3D | THREE.Texture | THREE.Material | THREE.BufferGeometry): void {
        if (!asset) return;

        if (this.hasDispose(asset)) {
            asset.dispose();
        }

        // Remove from caches if present
        this.textureCache.forEach((val, key) => {
            if (val === asset) this.textureCache.delete(key);
        });
        this.geometryCache.forEach((val, key) => {
            if (val === asset) this.geometryCache.delete(key);
        });
        this.materialCache.forEach((val, key) => {
            if (val === asset) this.materialCache.delete(key);
        });
    }

    private hasDispose(
      asset: THREE.Object3D | THREE.Texture | THREE.Material | THREE.BufferGeometry,
    ): asset is (THREE.Object3D | THREE.Texture | THREE.Material | THREE.BufferGeometry) & { dispose: () => void } {
      return typeof (asset as { dispose?: unknown }).dispose === 'function'
    }

    public purgeUnused(keepUrls: string[]): void {
        const urlsToRemove: string[] = [];
        this.textureCache.forEach((_texture, url) => {
            if (!keepUrls.includes(url)) {
                urlsToRemove.push(url);
            }
        });

        urlsToRemove.forEach(url => {
            const tex = this.textureCache.get(url);
            if (tex) {
                tex.dispose();
                this.textureCache.delete(url);
            }
        });
    }

  public purgeAll(): void {
    this.textureCache.forEach(t => t.dispose());
    this.geometryCache.forEach(g => g.dispose());
    this.materialCache.forEach(m => m.dispose());
    
    this.textureCache.clear();
    this.geometryCache.clear();
    this.materialCache.clear();
    this.contextGroups.clear();
  }
}
