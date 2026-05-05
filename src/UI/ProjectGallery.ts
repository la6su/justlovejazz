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
        PROJECTS.forEach((project, index) => {
            const item = document.createElement('div')
            item.className = `project-item project-pos-${index}`
            
            item.style.setProperty('--accent-color', project.color)

            item.innerHTML = `
                <div class="meta">${project.year} — ${project.category}</div>
                <h2 class="title">${project.title}</h2>
                <div class="category">${project.tags.join(' / ')}</div>
                <div class="project-link uk-link-text">View Case &rarr;</div>
                <a href="#" uk-toggle="target: #project-modal" class="uk-position-cover"></a>
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

    public setVisible(visible: boolean) {
        if (visible) {
            this.container.classList.add('visible')
        } else {
            this.container.classList.remove('visible')
        }
    }
}
