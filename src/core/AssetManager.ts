// src/core/AssetManager.ts
import * as THREE from 'three';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

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

  private ktx2Loader: KTX2Loader;
  private textureLoader: THREE.TextureLoader;

  private constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setWorkerLimit(2);
    this.ktx2Loader.setTranscoderPath('/basis/');
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
        ? await this.ktx2Loader.loadAsync(url) 
        : await this.textureLoader.loadAsync(url);

      if (texture.isTexture) {
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
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
      if ((asset as THREE.Texture).dispose) (asset as THREE.Texture).dispose();
      if ((asset as THREE.Material).dispose) (asset as THREE.Material).dispose();
      if ((asset as THREE.BufferGeometry).dispose) (asset as THREE.BufferGeometry).dispose();
    });

    this.contextGroups.delete(context);
    console.log(`AssetManager: Context [${context}] disposed.`);
  }

  public purgeUnused(keepUrls: string[]): void {
    this.textureCache.forEach((texture, url) => {
      if (!keepUrls.includes(url)) {
        texture.dispose();
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
