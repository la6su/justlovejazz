
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

  // Handle clicking on projects
  public handlePointerDown(clientX: number, clientY: number, camera: THREE.Camera) {
    this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(this.planes);

    if (intersects.length > 0) {
      const object = intersects[0].object as THREE.Mesh;
      const index = object.userData.index;
      
      console.log(`GalleryClick: hit index ${index}, active index ${this.manager.activeIndex}, state ${this.manager.state}`);
      
      if (index === this.manager.activeIndex) {
        console.log('GalleryClick: triggering FULLSCREEN');
        this.manager.startFullscreen();
      } else {
        console.log('GalleryClick: triggering PROJECT SWITCH');
        this.manager.setProject(index);
      }
    }
  }

  update(camera: THREE.Camera, _delta: number) {
    const progress = this.manager.transitionProgress;
    const activeIndex = this.manager.activeIndex;
    const state = this.manager.state;
    
    // 1. SLIDER LAYOUT & TRANSITION
    this.planes.forEach((mesh, i) => {
      const relativeIndex = i - activeIndex;
      
      if (i === activeIndex) {
        // ACTIVE MESH: Transition from Carousel Pos to Fullscreen
        const carouselX = 0;
        const carouselZ = 0;
        const carouselScale = 1;

        const fullscreenX = 0;
        const fullscreenZ = 1; // Bring it close to camera
        const fullscreenScale = 15; // Large enough to cover screen

        mesh.position.x = THREE.MathUtils.lerp(carouselX, fullscreenX, progress);
        mesh.position.y = THREE.MathUtils.lerp(0, 0, progress);
        mesh.position.z = THREE.MathUtils.lerp(carouselZ, fullscreenZ, progress);
        mesh.scale.setScalar(THREE.MathUtils.lerp(carouselScale, fullscreenScale, progress));
        mesh.visible = true;
      } else {
        // OTHER MESHES: Standard Carousel Logic
        if (Math.abs(relativeIndex) <= 1 && state !== 2) { // State 2 = FULLSCREEN
          const targetX = relativeIndex * 2.2;
          const targetZ = relativeIndex === 0 ? 0 : -1;
          const targetScale = 0.8;
          
          mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, targetX, 0.1);
          mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, targetZ, 0.1);
          mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, targetScale, 0.1));
          mesh.visible = true;
        } else {
          mesh.visible = false;
        }
      }
    });

    // 2. MATERIAL UPDATE
    this.materials.forEach(mat => mat.setProgress(progress));
  }
}
