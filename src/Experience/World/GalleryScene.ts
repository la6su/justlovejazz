
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
      const matWrapper = new ProjectMaterial(proj.textureUrl, proj.color);
      this.materials.push(matWrapper);

      const geometry = new THREE.PlaneGeometry(1, 1.4);
      const mesh = new THREE.Mesh(geometry, matWrapper.material);
      
      // Initial position doesn't matter much, update() will handle it
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
    
    // 1. SLIDER LAYOUT LOGIC
    // We position cards relative to the activeIndex
    this.planes.forEach((mesh, i) => {
      const relativeIndex = i - activeIndex;
      
      // Only the 3 central cards are fully visible/positioned
      // Others are pushed back or hidden
      if (Math.abs(relativeIndex) <= 1) {
        const targetX = relativeIndex * 2.2; // Spacing for 3 cards
        const targetZ = relativeIndex === 0 ? 0 : -1; // Active card is slightly forward
        const targetScale = relativeIndex === 0 ? 1 : 0.8;
        
        mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, targetX, 0.1);
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, targetZ, 0.1);
        mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, targetScale, 0.1));
        mesh.visible = true;
      } else {
        // Hide or push far away cards
        mesh.visible = false;
      }
    });

    // 2. CINEMATIC MOVE (DIVE)
    const activeMesh = this.planes[activeIndex];
    const viewPos = this.manager.getCurrentViewPosition();
    const viewLook = this.manager.getCurrentLookAt();
    const divePos = new THREE.Vector3().copy(activeMesh.position).add(new THREE.Vector3(0, 0, 1.2));
    const diveLook = activeMesh.position.clone();

    const targetPos = new THREE.Vector3().lerpVectors(viewPos, divePos, progress);
    const targetLook = new THREE.Vector3().lerpVectors(viewLook, diveLook, progress);

    camera.position.lerp(targetPos, 0.1);
    const currentLookAt = new THREE.Vector3();
    currentLookAt.lerp(targetLook, 0.1);
    camera.lookAt(currentLookAt);

    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = THREE.MathUtils.lerp(75, 45, progress);
    cam.updateProjectionMatrix();

    this.materials.forEach(mat => mat.setProgress(progress));
  }
}
