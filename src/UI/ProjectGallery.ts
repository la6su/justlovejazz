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
        this.setupStyles()
        this.render()
        document.body.appendChild(this.container)
    }

    private setupStyles() {
        const style = document.createElement('style')
        style.textContent = `
            .project-gallery {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10;
                display: grid;
                grid-template-columns: repeat(12, 1fr);
                grid-template-rows: repeat(12, 1fr);
                padding: 40px;
                box-sizing: border-box;
                font-family: 'Inter', sans-serif;
                color: white;
            }
            .project-item {
                pointer-events: auto;
                cursor: pointer;
                position: relative;
                transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1);
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                padding: 20px;
                border-left: 1px solid rgba(255,255,255,0.1);
            }
            .project-item:hover {
                transform: translateX(10px);
                background: rgba(255,255,255,0.05);
            }
            .project-item .title {
                font-size: 2rem;
                font-weight: 800;
                text-transform: uppercase;
                margin: 0;
                line-height: 1;
                transition: color 0.3s ease;
            }
            .project-item:hover .title {
                color: var(--accent-color, #ff3e00);
            }
            .project-item .meta {
                font-size: 0.8rem;
                opacity: 0.5;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .project-item .category {
                font-size: 1rem;
                opacity: 0.8;
                margin-top: 5px;
            }
        `
        document.head.appendChild(style)
    }

    private render() {
        PROJECTS.forEach((project, index) => {
            const item = document.createElement('div')
            item.className = 'project-item'
            
            // Asymmetric grid placement
            const gridPositions = [
                { col: '2 / span 4', row: '2 / span 4' },
                { col: '7 / span 3', row: '4 / span 3' },
                { col: '4 / span 4', row: '7 / span 5' },
                { col: '9 / span 3', row: '2 / span 4' },
            ]
            const pos = gridPositions[index % gridPositions.length]
            item.style.gridColumn = pos.col
            item.style.gridRow = pos.row
            item.style.setProperty('--accent-color', project.color)

            item.innerHTML = `
                <div class="meta">${project.year} — ${project.category}</div>
                <h2 class="title">${project.title}</h2>
                <div class="category">${project.tags.join(' / ')}</div>
            `

            item.addEventListener('mouseenter', () => this.onProjectHover?.(project))
            item.addEventListener('mouseleave', () => this.onProjectLeave?.())
            item.addEventListener('click', () => this.onProjectClick?.(project))

            this.items.push(item)
            this.container.appendChild(item)
        })
    }

    private onHover(project: Project) {
        // To be implemented: Trigger 3D world change
        console.log(`Hovering over ${project.title}`)
    }

    private onLeave() {
        // To be implemented: Reset 3D world
    }

    private onClick(project: Project) {
        // To be implemented: Cinematic transition to project detail
        console.log(`Clicked ${project.title}`)
    }
}
