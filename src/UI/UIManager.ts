
import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import type {Project} from '../Data/Projects'
import { ProjectGallery } from './ProjectGallery'
import { GalleryManager } from '../core/GalleryManager'

export class UIManager {
  public gallery!: ProjectGallery;

  constructor() {
    UIkit.use(Icons)
    if (!window.UIkit) {
      window.UIkit = UIkit
    }
  }

  async init() {
    console.log('UIManager initialized for Render-Driven UX')
    
    // Initialize the HTML Gallery
    this.gallery = new ProjectGallery({
        onClick: (project) => {
            const manager = window.experience?.galleryManager;
        
            if (manager) {
                const idx = manager.projects.findIndex(p => p.id === project.id);
                manager.setProject(idx);
            }
        }
    });

    this.initGalleryNav()
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


}
