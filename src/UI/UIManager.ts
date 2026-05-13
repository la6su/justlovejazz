
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
    
    // Initialize the HTML Gallery
    this.gallery = new ProjectGallery({
        onClick: (project) => {
            const manager = window.experience?.galleryManager;
            const scene = window.experience?.galleryScene;

            if (manager && scene) {
                const idx = manager.projects.findIndex(p => p.id === project.id);
                const mesh = scene.planes[idx];
                if (mesh) {
                    manager.expandCard(idx, mesh.position.clone(), mesh.scale.x);
                }
            }
        }
    });

    this.initGalleryNav();
    this.initDragAndDrop();
  }

  private initDragAndDrop() {
    let isDragging = false;
    let lastX = 0;
    let lastT = 0;

    const handlePointerDown = (e: PointerEvent) => {
      // Prevent drag if clicking on UI elements
      if ((e.target as HTMLElement).closest('.gallery-nav') || (e.target as HTMLElement).closest('.project-card')) {
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
  }

  private initGalleryNav() {
    const nav = document.createElement('div')
    nav.className = 'gallery-nav uk-position-fixed uk-position-bottom-right uk-margin-large'
    nav.innerHTML = `
      <div class="gallery-nav__controls uk-flex uk-flex-middle">
        <button class="gallery-nav__btn prev uk-button uk-button-default" aria-label="Previous project">
          <img src="/src/assets/master-quantum-flares/icons/slidenav-previous-large.svg" alt="Prev" class="nav-icon">
        </button>
        <button class="gallery-nav__btn next uk-button uk-button-default" aria-label="Next project">
          <img src="/src/assets/master-quantum-flares/icons/slidenav-next-large.svg" alt="Next" class="nav-icon">
        </button>
      </div>
    `
    document.body.appendChild(nav)

    const prevBtn = nav.querySelector('.prev')
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const manager = window.experience?.galleryManager
        if (manager) {
          const nextIdx = (manager.activeIndex - 1 + manager.projects.length) % manager.projects.length
          manager.setProject(nextIdx)
        }
      })
    }

    const nextBtn = nav.querySelector('.next')
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const manager = window.experience?.galleryManager
        if (manager) {
          const nextIdx = (manager.activeIndex + 1) % manager.projects.length
          manager.setProject(nextIdx)
        }
      })
    }
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
