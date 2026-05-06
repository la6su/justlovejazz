
import * as THREE from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { uniform, vec3, float, color, texture, uv, mix, positionLocal } from 'three/tsl';

export class ProjectMaterial {
  public material: MeshBasicNodeMaterial;
  private progressUniform = uniform(0);

  constructor(mainTex: THREE.Texture, detailTex: THREE.Texture, baseColor: string) {
    this.material = new MeshBasicNodeMaterial();

    const tex = texture(mainTex);
    const detTex = texture(detailTex);
    const col = color(baseColor);
    const p = this.progressUniform;

    // --- Vertex Stage: GPU Distortion (Cinematic Pop) ---
    // Creates a spherical bulge effect that peaks during the transition
    const dist = positionLocal.length();
    const bulge = float(1.0).add(
        p.mul(p).mul(float(1.0).sub(p)) // Peak at p=0.66
        .mul(float(1.0).sub(dist))
        .mul(0.2)
    );
    this.material.positionNode = positionLocal.mul(bulge);

    // --- Fragment Stage: Masked Reveal & Visuals ---
    
    // Zoom simulation in UV space
    const zoomUV = uv().mul(2.0).sub(1.0).mul(mix(1.0, 0.1, p)).add(0.5);

    // Chromatic Aberration
    const shift = p.mul(0.02);
    const r = tex.sample(zoomUV.add(shift)).r;
    const g = tex.sample(zoomUV).g;
    const b = tex.sample(zoomUV.sub(shift)).b;
    const baseCol = vec3(r, g, b);
    
    // Procedural Detail
    const detailCol = detTex.sample(uv());
    const detailGrid = uv().mul(100.0).fract().sub(0.5).abs().mul(0.01);
    const noiseLayer = detailGrid.add(detailCol.r).mul(0.1);
    
    // Masked Reveal: Radial gradient mask
    const centerDist = uv().mul(2.0).sub(1.0).length();
    const mask = float(1.0).sub(centerDist).mul(p).clamp(0, 1);
    
    // Blend based on mask and progress
    const detailBlend = mix(detailCol, col, p.mul(0.2));
    const finalCol = mix(baseCol.add(noiseLayer), detailBlend, mask);
    
    this.material.colorNode = finalCol;
  }

  setProgress(value: number) {
    this.progressUniform.value = value;
  }
}

