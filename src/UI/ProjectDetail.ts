// src/UI/ProjectDetail.ts — Cinematic project detail overlay (slides in, no HW antialias)
import UIkit from 'uikit'
import { type Project } from '../core/types'
import type { UIkitModal } from '../types/uikit'

export class ProjectDetail {
    private modal: UIkitModal | null = null
    private content: HTMLElement | null = null

    constructor() {
        const el = document.getElementById('project-modal')
        const content = document.getElementById('modal-content')

        if (!el || !content) {
            console.warn('ProjectDetail: modal elements not found')
            return
        }

        this.content = content
        this.modal = UIkit.modal(el) as unknown as UIkitModal

        // Warm-up
        this.modal.show()
        this.modal.hide()

        // On close → dispatch event for gallery return
        UIkit.util.on(el, 'close', () => {
            window.dispatchEvent(new CustomEvent('project-detail-closed'))
        })
    }

    public open(project: Project) {
        if (!this.content) return

        this.content.innerHTML = `
            <div class="detail-header uk-flex uk-flex-between uk-flex-middle uk-margin-medium-bottom">
                <h1 class="detail-title">${project.title}</h1>
                <div class="detail-meta">${project.year} — ${project.category}</div>
            </div>
            <div class="detail-body uk-grid-small uk-grid">
                <div class="uk-width-1-2@m">
                    <p class="detail-text">${project.description}</p>
                </div>
                <div class="uk-width-1-2@m">
                    <div class="detail-tags uk-flex uk-flex-wrap uk-gap-small">
                        ${project.tags?.map(t => `<span class="detail-tag">${t}</span>`).join('') ?? ''}
                    </div>
                </div>
            </div>
        `

        this.modal?.show()
    }

    public close() {
        this.modal?.hide()
    }
}
