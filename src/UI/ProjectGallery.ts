// src/UI/ProjectGallery.ts
import { PROJECTS, type Project } from '../Data/Projects'
import { GalleryManager } from '../core/GalleryManager'

export class ProjectGallery {
    private container: HTMLElement
    private items: HTMLElement[] = []
    private onProjectHover?: (project: Project) => void
    private onProjectLeave?: () => void
    private onProjectClick?: (project: Project) => void

    constructor(callbacks?: { 
        onHover?: (p: Project) => void, 
        onLeave?: () => void, 
        onClick?: (p: Project) => void 
    }) {
        if (callbacks) {
            this.onProjectHover = callbacks.onHover
            this.onProjectLeave = callbacks.onLeave
            this.onProjectClick = callbacks.onClick
        }
        this.container = document.createElement('div')
        this.container.className = 'project-gallery'
        this.render()
        
        const worksSection = document.getElementById('works')
        if (worksSection) {
            worksSection.appendChild(this.container)
        } else {
            document.body.appendChild(this.container)
        }
    }

    private render() {
        this.container.innerHTML = ''
        this.items = []

        PROJECTS.forEach((project, index) => {
            const item = document.createElement('div')
            item.className = `project-card-wrapper project-pos-${index}`
            
            item.style.setProperty('--accent-color', project.color)

            item.innerHTML = `
                <div class="project-card">
                    <div class="project-card__content">
                        <span class="project-card__index">0${index + 1}</span>
                        <h2 class="project-card__title">${project.title}</h2>
                        <div class="project-card__meta">${project.year} — ${project.category}</div>
                    </div>
                </div>
            `

            item.addEventListener('mouseenter', () => this.onProjectHover?.(project))
            item.addEventListener('mouseleave', () => this.onProjectLeave?.())
            item.addEventListener('click', (e) => {
                e.preventDefault()
                this.onProjectClick?.(project)
            })

            this.items.push(item)
            this.container.appendChild(item)
        })
    }

    public update(manager: GalleryManager) {
        const { activeIndex, transitionProgress } = manager;
        const pixelsPerUnit = window.innerWidth * 0.12; 
        
        this.items.forEach((item, i) => {
            const relativeIndex = i - activeIndex;
            
            // Position based on 3D logic (relativeIndex * 2.2)
            const x = relativeIndex * pixelsPerUnit * 2.2;
            const opacity = Math.abs(relativeIndex) <= 1 ? 1 : 0;
            
            // Fade out when transitioning to fullscreen
            const finalOpacity = opacity * (1 - transitionProgress);
            
            // Scale for active item
            const scale = relativeIndex === 0 ? 1.1 : 0.9;
            const finalScale = relativeIndex === 0 
                ? 1.1 - (transitionProgress * 0.1) 
                : 0.9;

            item.style.transform = `translate3d(${x}px, 0, 0) scale(${finalScale})`;
            item.style.opacity = `${finalOpacity}`;
            item.style.pointerEvents = transitionProgress > 0.5 ? 'none' : 'auto';
            
            item.classList.toggle('is-active', relativeIndex === 0);
        });
    }

    public setVisible(visible: boolean) {
        this.container.style.visibility = visible ? 'visible' : 'hidden';
    }

    public setFocusedProject(projectId: string | null) {
        this.items.forEach((item, index) => {
            const project = PROJECTS[index];
            item.classList.toggle('project-focused', project.id === projectId);
        });
    }
}
