
import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import type {Project} from '../Data/Projects'

export class UIManager {
  constructor() {
    UIkit.use(Icons)
    if (!window.UIkit) {
      window.UIkit = UIkit
    }
  }

  async init() {
    console.log('UIManager initialized for Render-Driven UX')
    this.initGalleryNav()
  }

  private initGalleryNav() {
    const nav = document.createElement('div')
    nav.className = 'gallery-nav'
    nav.innerHTML = `
      <button class="gallery-nav__btn prev" aria-label="Previous project">
        <span class="nav-line"></span>
        <span class="nav-text">PREV</span>
      </button>
      <button class="gallery-nav__btn next" aria-label="Next project">
        <span class="nav-line"></span>
        <span class="nav-text">NEXT</span>
      </button>
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

  public setProjectActive(projectId: string) {
    document.querySelectorAll('.project-section').forEach(sec => {
      sec.classList.toggle('is-active', sec.getAttribute('data-id') === projectId);
    });
  }

  public showProjectContent(project: Project) {
    console.log(`Showing content for project: ${project.id}`);
    // Integration with UI elements would go here
  }

  public hideProjectContent() {
    console.log('Hiding project content');
    // Integration with UI elements would go here
  }
}
