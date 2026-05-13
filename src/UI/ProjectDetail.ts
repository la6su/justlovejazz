// src/UI/ProjectDetail.ts — Cinematic project detail overlay (slides in, no HW antialias)
import UIkit from 'uikit'
import { type Project } from '../core/types'
import type { UIkitModal } from '../types/uikit'

export class ProjectDetail {
    private modal: UIkitModal | null = null
    private content: HTMLElement | null = null
    private modalRoot: HTMLElement | null = null

    constructor() {
        const el = document.getElementById('project-modal')
        const content = document.getElementById('modal-content')

        if (!el || !content) {
            /* Modal elements not found — skip */
            return
        }

        this.modalRoot = el
        this.content = content
        this.modal = UIkit.modal(el) as unknown as UIkitModal

        el.setAttribute('role', 'dialog')
        el.setAttribute('aria-modal', 'true')
        el.setAttribute('aria-label', 'Project details')
        el.setAttribute('aria-hidden', 'true')

        // Warm-up
        this.modal.show()
        this.modal.hide()

        // On close → dispatch event for gallery return
        UIkit.util.on(el, 'close', () => {
            el.setAttribute('aria-hidden', 'true')
            window.dispatchEvent(new CustomEvent('project-detail-closed'))
        })
    }

    public open(project: Project) {
        if (!this.content || !this.modalRoot) return

        this.content.innerHTML = `
            <div class="detail-header uk-flex uk-flex-between uk-flex-middle uk-margin-medium-bottom">
                <h1 id="modal-project-title" class="detail-title" tabindex="-1">${project.title}</h1>
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

        this.modalRoot.setAttribute('aria-labelledby', 'modal-project-title')
        this.modalRoot.setAttribute('aria-hidden', 'false')

        this.modal?.show()

        requestAnimationFrame(() => {
            const heading = this.content?.querySelector('#modal-project-title')
            if (heading instanceof HTMLElement) heading.focus({ preventScroll: true })
        })
    }

    public close() {
        this.modal?.hide()
    }
}
