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
                    <div class="project-card__image" aria-hidden="true">
                        <img src="${project.textureUrl}" alt="" loading="lazy" class="project-card__thumb" />
                    </div>
                    <div class="project-card__overlay"></div>
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
        if (window.innerWidth < 768) return

        const { transitionProgress } = manager
        const pixelsPerUnit = window.innerWidth * 0.12

        this.items.forEach((item, i) => {
            const wrapped = manager.getWrappedOffset(i)
            const relative = wrapped / manager.STEP
            const x = relative * pixelsPerUnit * 2.2
            const depth = Math.min(Math.abs(relative), 1.5) / 1.5
            const opacity = Math.abs(relative) <= 1.5 ? 1 - depth * 0.5 : 0
            const finalOpacity = opacity * (1 - transitionProgress)
            const finalScale = (1 - depth * 0.18) * (1 - transitionProgress * 0.08)
            const y = Math.sin(relative * 1.1) * 12 + manager.smoothedVelocity * -10 * (1 - depth)
            const rotateY = relative * -7 + manager.smoothedVelocity * -10
            const thumb = relative * 14 + manager.smoothedVelocity * -18

            item.style.transform = `translate3d(${x}px, ${y}px, ${-depth * 30}px) rotateY(${rotateY}deg) scale(${finalScale})`
            item.style.opacity = `${finalOpacity}`
            item.style.pointerEvents = transitionProgress > 0.5 ? 'none' : 'auto'
            item.classList.toggle('is-active', Math.abs(relative) < 0.5)
            item.style.setProperty('--thumb-parallax-x', `${thumb}px`)
        })
    }

    public setVisible(visible: boolean) {
        this.container.style.visibility = visible ? 'visible' : 'hidden'
    }

    public setFocusedProject(projectId: string | null) {
        this.items.forEach((item, index) => {
            const project = PROJECTS[index]
            item.classList.toggle('project-focused', project.id === projectId)
        })
    }
}
