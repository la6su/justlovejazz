
import * as THREE from 'three';
import { GalleryManager } from '../../core/GalleryManager';
import { ProjectMaterial } from '../../shaders/ProjectMaterial';

export class GalleryScene {
  public group = new THREE.Group();
  public planes: THREE.Mesh[] = [];
  public materials: ProjectMaterial[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(private manager: GalleryManager) {
    this.init();
  }

  private init() {
    this.manager.projects.forEach((proj, i) => {
      const matWrapper = new ProjectMaterial(proj.textureUrl, proj.detailTextureUrl, proj.color);
      this.materials.push(matWrapper);

      const geometry = new THREE.PlaneGeometry(1, 1.4);
      const mesh = new THREE.Mesh(geometry, matWrapper.material);
      
      mesh.userData = { 
        projectId: proj.id, 
        index: i 
      };

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

    update(camera: THREE.Camera, _delta: number) {
      const progress = this.manager.transitionProgress;
      const activeIndex = this.manager.activeIndex;
      
      const trackLength = this.manager.trackLength;
      const halfTrack = trackLength / 2;
      
      const visualProgress = progress; 
      
      this.planes.forEach((mesh, i) => {
        if (i === activeIndex && progress > 0) { // Progress > 0 means we are transitioning or in fullscreen
          // ACTIVE MESH: Transition to Fullscreen
          const fullscreenX = 0;
          const fullscreenZ = 1; 
          const fullscreenScale = 15; 
          
          mesh.position.x = THREE.MathUtils.lerp(this.manager.transitionStartPos.x, fullscreenX, visualProgress);
          mesh.position.y = THREE.MathUtils.lerp(this.manager.transitionStartPos.y, 0, visualProgress);
          mesh.position.z = THREE.MathUtils.lerp(this.manager.transitionStartPos.z, fullscreenZ, visualProgress);
          mesh.scale.setScalar(THREE.MathUtils.lerp(this.manager.transitionStartScale, fullscreenScale, visualProgress));
          mesh.visible = true;
        } else {
          // OTHER MESHES: Wrap-around Carousel Logic
          let pos = (i * this.manager.STEP) - this.manager.scrollX;
          
          if (pos < -halfTrack) pos += trackLength;
          if (pos > halfTrack) pos -= trackLength;

          const relativeX = pos / this.manager.STEP;
          
          if (Math.abs(relativeX) <= 1.5 && progress < 1) { // progress < 1 means not fully in fullscreen
            const targetX = relativeX * 2.2;
            const targetZ = Math.abs(relativeX) < 0.5 ? 0 : -1;
            const targetScale = 0.8;
            
            mesh.position.x = targetX;
            mesh.position.z = targetZ;
            mesh.scale.setScalar(targetScale);
            mesh.visible = true;
          } else {
            mesh.visible = false;
          }
        }
      });

      this.materials.forEach(mat => mat.setProgress(progress));
    }
}
