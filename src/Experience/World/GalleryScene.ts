
import * as THREE from 'three';
import { GalleryManager } from '../../core/GalleryManager';
import { ProjectMaterial } from '../../shaders/ProjectMaterial';
import { AssetManager } from '../../core/AssetManager';
import { WorldSection, type WorldState } from '../../core/types';


export class GalleryScene {
  public group = new THREE.Group();
  public planes: THREE.Mesh[] = [];
  public materials: ProjectMaterial[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(private manager: GalleryManager, private sizes: any) {
    // Init is now called asynchronously from Bootstrapper
  }

  public async init() {
    const assetManager = AssetManager.getInstance();
    
    const projectData = this.manager.projects.map(async (proj, i) => {
      const [tex, detTex] = await Promise.all([
        assetManager.loadTexture(proj.textureUrl),
        assetManager.loadTexture(proj.detailTextureUrl)
      ]);

      const matWrapper = new ProjectMaterial(tex, detTex, proj.color);
      
      const geometry = new THREE.PlaneGeometry(1, 1.4);
      const mesh = new THREE.Mesh(geometry, matWrapper.material);
      
      mesh.userData = { 
        projectId: proj.id, 
        index: i 
      };

      return { matWrapper, mesh };
    });

    const results = await Promise.all(projectData);

    results.forEach(({ matWrapper, mesh }) => {
      this.materials.push(matWrapper);
      this.planes.push(mesh);
      this.group.add(mesh);
    });
  }

  public handlePointerDown(clientX: number, clientY: number, camera: THREE.Camera) {
    this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(this.planes);

    if (intersects.length > 0) {
      const object = intersects[0].object as THREE.Mesh;
      const index = object.userData.index;
      
      // Capture current state to avoid jumping
      this.manager.transitionStartPos.copy(object.position);
      this.manager.transitionStartScale = object.scale.x;
      
      this.manager.activeIndex = index;
      this.manager.startFullscreen();
    }
  }


    update(camera: THREE.Camera, _delta: number, worldState: WorldState) {
      if (worldState.currentSection !== WorldSection.WORKS) {
        this.group.visible = false;
        return;
      }

      this.group.visible = true;
      const progress = this.manager.transitionProgress;
      const activeIndex = this.manager.activeIndex;
      const isMobile = this.sizes.isMobile;
      
      if (Math.random() < 0.01) {
        const keepUrls: string[] = [];
        const neighbors = [activeIndex - 1, activeIndex, activeIndex + 1];
        neighbors.forEach(idx => {
          if (idx >= 0 && idx < this.manager.projects.length) {
            const p = this.manager.projects[idx];
            keepUrls.push(p.textureUrl, p.detailTextureUrl);
          }
        });
        AssetManager.getInstance().purgeUnused(keepUrls);
      }
      
      const trackLength = this.manager.trackLength;
      const halfTrack = trackLength / 2;
      const visualProgress = progress; 
      
      this.planes.forEach((mesh, i) => {
        if (i === activeIndex && progress > 0) {
          const fullscreenX = 0;
          const fullscreenY = 0;
          const fullscreenZ = 1; 
          const fullscreenScale = 15; 
          
          mesh.position.x = THREE.MathUtils.lerp(this.manager.transitionStartPos.x, fullscreenX, visualProgress);
          mesh.position.y = THREE.MathUtils.lerp(this.manager.transitionStartPos.y, fullscreenY, visualProgress);
          mesh.position.z = THREE.MathUtils.lerp(this.manager.transitionStartPos.z, fullscreenZ, visualProgress);
          mesh.scale.setScalar(THREE.MathUtils.lerp(this.manager.transitionStartScale, fullscreenScale, visualProgress));
          mesh.visible = true;
        } else {
          let pos = (i * this.manager.STEP) - this.manager.scrollX;
          if (pos < -halfTrack) pos += trackLength;
          if (pos > halfTrack) pos -= trackLength;

          if (isMobile) {
            // MOBILE: Vertical 1-column List
            const relativeY = pos / this.manager.STEP;
            if (Math.abs(relativeY) <= 1.5 && progress < 1) {
              mesh.position.x = 0;
              mesh.position.y = relativeY * 2.5;
              mesh.position.z = Math.abs(relativeY) < 0.5 ? 0 : -1;
              mesh.scale.setScalar(0.7);
              mesh.visible = true;
            } else {
              mesh.visible = false;
            }
          } else {
            // DESKTOP: Horizontal Carousel
            const relativeX = pos / this.manager.STEP;
            if (Math.abs(relativeX) <= 1.5 && progress < 1) {
              mesh.position.x = relativeX * 2.2;
              mesh.position.y = 0;
              mesh.position.z = Math.abs(relativeX) < 0.5 ? 0 : -1;
              mesh.scale.setScalar(0.8);
              mesh.visible = true;
            } else {
              mesh.visible = false;
            }
          }
        }
      });

      this.materials.forEach(mat => mat.setProgress(progress));
    }

}
