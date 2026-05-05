// src/UI/ProjectGallery.ts
import { PROJECTS, type Project } from '../Data/Projects'

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
            console.warn('Section #works not found, appending gallery to body')
            document.body.appendChild(this.container)
        }
    }

    private render() {
        const list = document.createElement('div')
        list.className = 'project-slider__list uk-flex uk-flex-middle'

        PROJECTS.forEach((project, index) => {
            const item = document.createElement('div')
            item.className = `project-slider__item project-pos-${index}`
            
            item.style.setProperty('--accent-color', project.color)

            item.innerHTML = `
                <div class="project-card">
                    <div class="project-card__image-wrapper">
                        <img src="${project.textureUrl}" alt="${project.title}" class="project-card__img">
                        <div class="project-card__overlay"></div>
                    </div>
                    <div class="project-card__content">
                        <span class="project-card__index">0${index + 1}</span>
                        <h2 class="project-card__title">${project.title}</h2>
                        <div class="project-card__meta">${project.year} — ${project.category}</div>
                    </div>
                    <div class="uk-position-cover"></div>
                </div>
            `

            item.addEventListener('mouseenter', () => this.onProjectHover?.(project))
            item.addEventListener('mouseleave', () => this.onProjectLeave?.())
            item.addEventListener('click', (e) => {
                e.preventDefault()
                this.onProjectClick?.(project)
            })

            this.items.push(item)
            list.appendChild(item)
        })
        this.container.appendChild(list)
    }

    public setVisible(visible: boolean) {
        if (visible) {
            this.container.classList.add('visible')
        } else {
            this.container.classList.remove('visible')
        }
    }

    public getGalleryItems() {
        return this.items
    }

    public setFocusedProject(projectId: string | null) {
        this.items.forEach((item, index) => {
            if (projectId === null) {
                item.classList.remove('project-focused')
            } else if (index === PROJECTS.findIndex(p => p.id === projectId)) {
                item.classList.add('project-focused')
            } else {
                item.classList.remove('project-focused')
            }
        })
    }
}
