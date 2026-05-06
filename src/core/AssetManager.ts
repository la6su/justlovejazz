
import * as THREE from 'three';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

export class AssetManager {
  private static instance: AssetManager;
  private textureCache: Map<string, THREE.Texture> = new Map();
  private ktx2Loader: KTX2Loader;
  private textureLoader: THREE.TextureLoader;

  private constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.ktx2Loader = new KTX2Loader();
    
    // Note: KTX2Loader requires a worker and WASM files. 
    // In a production environment, these paths would be configured.
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
   * Loads a texture. Prefers KTX2 if the extension is .ktx2, otherwise falls back to TextureLoader.
   */
  public async loadTexture(url: string): Promise<THREE.Texture> {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)!;
    }

    let texture: THREE.Texture;

    try {
      if (url.endsWith('.ktx2')) {
        texture = await this.ktx2Loader.loadAsync(url);
      } else {
        texture = await this.textureLoader.loadAsync(url);
      }
      
      // Production polish: set filtering to Bicubic if supported
      if (texture.isTexture) {
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        // @ts-ignore - Bicubic is available in newer Three.js versions
        if (THREE.BicubicInterpolation) {
          texture.filter = THREE.BicubicInterpolation;
        }
      }
    } catch (e) {
      console.error(`AssetManager: Failed to load texture ${url}`, e);
      // Return a 1x1 transparent pixel as fallback
      texture = new THREE.DataTexture(new Uint8Array([0,0,0,0]), 1, 1);
    }

    this.textureCache.set(url, texture);
    return texture;
  }

  /**
   * Unloads textures to free VRAM.
   */
  public unloadTexture(url: string): void {
    const texture = this.textureCache.get(url);
    if (texture) {
      texture.dispose();
      this.textureCache.delete(url);
    }
  }

  /**
   * Bulk unload textures not in the provided list.
   */
  public purgeUnused(keepUrls: string[]): void {
    for (const url of this.textureCache.keys()) {
      if (!keepUrls.includes(url)) {
        this.unloadTexture(url);
      }
    }
  }

  public getCacheSize(): number {
    return this.textureCache.size;
  }
}
