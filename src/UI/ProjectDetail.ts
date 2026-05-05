// src/UI/ProjectDetail.ts
import UIkit from 'uikit'
import { type Project } from '../Data/Projects'

export class ProjectDetail {
    private modalElement: HTMLElement | null = null
    private contentElement: HTMLElement | null = null
    private modalInstance: any = null

    constructor() {
        this.modalElement = document.getElementById('project-modal')
        this.contentElement = document.getElementById('modal-content')

        if (this.modalElement && UIkit) {
            this.modalInstance = UIkit.modal(this.modalElement)

            // 1. Pre-fill with a skeleton to avoid "null -> huge" layout jump on first click
            if (this.contentElement) {
                this.contentElement.innerHTML = '<div class="uk-placeholder"></div>'
            }

            // 2. Warm-up: Trigger show/hide immediately to prime animations and DOM
            // This happens during bootstrap, so the user doesn't see the flicker
            this.modalInstance.show()
            this.modalInstance.hide()

            UIkit.util.on(this.modalElement, 'close', () => {
                window.dispatchEvent(new CustomEvent('project-detail-closed'))
            })
        } else {
            console.error('UIkit or Project Modal element not found in DOM')
        }
    }

    public open(project: Project) {
        if (!this.contentElement) return

        // Inject content using UIkit classes for consistency
        this.contentElement.innerHTML = `
            <div class="detail-header uk-flex uk-flex-between uk-flex-middle uk-margin-medium-bottom" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px;">
                <h1 class="detail-title" style="color: ${project.color}; margin: 0;">${project.title}</h1>
                <div class="detail-meta">${project.year} — ${project.category}</div>
            </div>
            <div class="detail-body uk-grid-small uk-grid">
                <div class="uk-width-1-2@m">
                    <p class="detail-text">${project.description}</p>
                </div>
                <div class="uk-width-1-2@m">
                    <div class="detail-tags uk-flex uk-flex-wrap uk-gap-small">
                        ${project.tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `

        if (this.modalInstance) {
            this.modalInstance.show()
        }
    }

    public close() {
        if (this.modalInstance) {
            this.modalInstance.hide()
        }
    }
}
