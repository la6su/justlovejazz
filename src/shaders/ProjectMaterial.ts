
import * as THREE from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { uniform, vec3, float, color, texture, uv, mix } from 'three/tsl';


export class ProjectMaterial {
  public material: MeshBasicNodeMaterial;
  private progressUniform = uniform(0);

  constructor(textureUrl: string, detailTextureUrl: string, baseColor: string) {
    this.material = new MeshBasicNodeMaterial();

    const tex = texture(new THREE.TextureLoader().load(textureUrl));
    const detTex = texture(new THREE.TextureLoader().load(detailTextureUrl));
    const col = color(baseColor);
    const p = this.progressUniform;

    // Zoom simulation in UV space
    const zoomUV = uv().mul(2.0).sub(1.0).mul(mix(1.0, 0.1, p)).add(0.5);

    // Chromatic Aberration
    const shift = p.mul(0.02);
    
    // Base Texture Sample
    const r = tex.sample(zoomUV.add(shift)).r;
    const g = tex.sample(zoomUV).g;
    const b = tex.sample(zoomUV.sub(shift)).b;
    const baseCol = vec3(r, g, b);

    // Detail Texture Sample (simple)
    const detailCol = detTex.sample(uv());

    // Blend base and detail based on progress
    const finalCol = mix(baseCol, mix(detailCol, col, p.mul(0.2)), p);
    this.material.colorNode = finalCol;
  }

  setProgress(value: number) {
    this.progressUniform.value = value;
  }
}
