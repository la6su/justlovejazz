// src/UI/ProjectDetail.ts
import { type Project } from '../Data/Projects'

export class ProjectDetail {
    private container: HTMLElement
    private currentProject: Project | null = null

    constructor() {
        this.container = document.createElement('div')
        this.container.className = 'project-detail'
        this.setupStyles()
        this.setupContainer()
        document.body.appendChild(this.container)
    }

    private setupStyles() {
        const style = document.createElement('style')
        style.textContent = `
            .project-detail {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #05050a;
                z-index: 100;
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.6s cubic-bezier(0.2, 0, 0.2, 1);
                color: white;
                font-family: 'Inter', sans-serif;
            }
            .project-detail.active {
                opacity: 1;
                pointer-events: auto;
            }
            .detail-content {
                max-width: 800px;
                width: 80%;
                transform: translateY(30px);
                transition: transform 0.8s cubic-bezier(0.2, 0, 0.2, 1);
                opacity: 0;
            }
            .project-detail.active .detail-content {
                transform: translateY(0);
                opacity: 1;
            }
            .detail-header {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                margin-bottom: 40px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                padding-bottom: 20px;
            }
            .detail-title {
                font-size: 4rem;
                font-weight: 800;
                text-transform: uppercase;
                margin: 0;
                line-height: 1;
            }
            .detail-meta {
                font-size: 1rem;
                opacity: 0.5;
                text-transform: uppercase;
            }
            .detail-body {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
            }
            .detail-text {
                font-size: 1.2rem;
                line-height: 1.6;
                opacity: 0.8;
            }
            .detail-tags {
                margin-top: 20px;
                display: flex;
                gap: 10px;
            }
            .detail-tag {
                font-size: 0.7rem;
                padding: 4px 8px;
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 2px;
                text-transform: uppercase;
            }
            .close-btn {
                position: absolute;
                top: 40px;
                right: 40px;
                cursor: pointer;
                font-size: 1rem;
                text-transform: uppercase;
                opacity: 0.5;
                transition: opacity 0.3s ease;
            }
            .close-btn:hover {
                opacity: 1;
            }
        `
        document.head.appendChild(style)
    }

    private setupContainer() {
        this.container.innerHTML = `
            <div class="close-btn">Close ×</div>
            <div class="detail-content">
                <div class="detail-header">
                    <h1 class="detail-title">Project Title</h1>
                    <div class="detail-meta">Year — Category</div>
                </div>
                <div class="detail-body">
                    <div class="detail-text">Description goes here...</div>
                    <div class="detail-tags"></div>
                </div>
            </div>
        `
        this.container.querySelector('.close-btn')?.addEventListener('click', () => {
            this.close()
            // Trigger global event to reset camera
            window.dispatchEvent(new CustomEvent('project-detail-closed'))
        })
    }

    public open(project: Project) {
        this.currentProject = project
        const title = this.container.querySelector('.detail-title') as HTMLElement
        const meta = this.container.querySelector('.detail-meta') as HTMLElement
        const text = this.container.querySelector('.detail-text') as HTMLElement
        const tagsContainer = this.container.querySelector('.detail-tags') as HTMLElement

        title.textContent = project.title
        title.style.color = project.color
        meta.textContent = `${project.year} — ${project.category}`
        text.textContent = project.description
        
        tagsContainer.innerHTML = ''
        project.tags.forEach(tag => {
            const span = document.createElement('span')
            span.className = 'detail-tag'
            span.textContent = tag
            tagsContainer.appendChild(span)
        })

        this.container.classList.add('active')
    }

    public close() {
        this.container.classList.remove('active')
        this.currentProject = null
    }
}
