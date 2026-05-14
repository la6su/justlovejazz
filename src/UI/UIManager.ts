
import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import type { Project } from '../Data/Projects'
import { ProjectGallery } from './ProjectGallery'

export class UIManager {
  public gallery!: ProjectGallery;

  constructor() {
    UIkit.use(Icons)
    if (!window.UIkit) {
      window.UIkit = UIkit
    }
  }

  async init() {
  /* UIManager initialized */
    const page = document.body.dataset.page
    if (page !== 'works') return

    const worksSection = document.getElementById('works')
    if (!worksSection) return

    // Initialize sticky Works gallery
    this.gallery = new ProjectGallery({
        onClick: async (project) => {
            const manager = window.experience?.galleryManager;
            const scene = window.experience?.galleryScene;

            if (manager && scene) {
                const idx = manager.projects.findIndex(p => p.id === project.id);
                manager.setProject(idx)
                await scene.ensureCardTextures(idx)
                const mesh = scene.planes[idx];
                if (mesh) {
                    manager.expandCard(idx, mesh.position.clone(), mesh.scale.x);
                }
            }
        }
    });

    this.initDragAndDrop();
  }

  private initDragAndDrop() {
    let isDragging = false;
    let lastX = 0;
    let lastT = 0;

    const handlePointerDown = (e: PointerEvent) => {
      // Prevent drag if clicking on UI elements
      if ((e.target as HTMLElement).closest('.works-sticky')) {
        return;
      }

      isDragging = true;
      lastX = e.clientX;
      lastT = performance.now();
      document.body.classList.add('dragging');
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      
      // Capture pointer to keep receiving events even if cursor leaves the element
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      const manager = window.experience?.galleryManager;
      if (!manager) return;

      const dx = e.clientX - lastX;
      manager.drag(dx);

      // Track velocity for momentum
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      const velocity = dx / dt;
      manager.setDragVelocity(velocity);

      lastX = e.clientX;
      lastT = now;
    };

    const handlePointerUp = (_e: PointerEvent) => {
      isDragging = false;
      document.body.classList.remove('dragging');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointerdown', handlePointerDown);

    const handleWheel = (e: WheelEvent) => {
      const manager = window.experience?.galleryManager
      if (!manager) return
      if (manager.isTransitioning) return

      const works = document.getElementById('works')
      if (!works) return
      const rect = works.getBoundingClientRect()
      const inViewport = rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3
      if (!inViewport) return

      const dominantDelta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      manager.wheel(dominantDelta)
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
  }

  public showProjectContent(project: Project) {
    let overlay = document.querySelector<HTMLElement>('.fullscreen-overlay')
    if (!overlay) {
      overlay = document.createElement('div')
      overlay.className = 'fullscreen-overlay'
      document.body.appendChild(overlay)
    }

    overlay.innerHTML = `
      <div class="fullscreen-overlay__content">
        <h2>${project.title}</h2>
        <p>${project.description}</p>
      </div>
    `
    overlay.style.opacity = '1'
    overlay.style.pointerEvents = 'auto'
  }

  public hideProjectContent() {
    const overlay = document.querySelector<HTMLElement>('.fullscreen-overlay')
    if (!overlay) return

    overlay.style.opacity = '0'
    overlay.style.pointerEvents = 'none'
  }


}
