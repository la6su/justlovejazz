// src/UI/ProjectDetail.ts — Cinematic project detail overlay
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

        UIkit.util.on(el, 'close', () => {
            el.setAttribute('aria-hidden', 'true')
            this.content?.querySelector('img')?.remove()
            window.dispatchEvent(new CustomEvent('project-detail-closed'))
        })
    }

    public open(project: Project) {
        if (!this.content || !this.modalRoot) return

        const tagsHtml = project.tags?.map(t => `<span class="detail-tag">${t}</span>`).join('') ?? ''

        this.content.innerHTML = `
            <div class="detail-hero">
                <div class="detail-hero__media" style="background-color: ${project.color}22;">
                    <img 
                        src="${project.detailTextureUrl}" 
                        alt="${project.title}"
                        loading="lazy"
                        class="detail-hero__image"
                        onerror="this.parentElement.innerHTML='<div class=\\'detail-hero__fallback\\' style=\\'color:${project.color};\\\\</div>'"
                    />
                </div>
                <div class="detail-hero__info">
                    <div class="detail-hero__meta">
                        <span class="detail-hero__year">${project.year}</span>
                        <span class="detail-hero__category">${project.category}</span>
                    </div>
                    <h1 id="modal-project-title" class="detail-hero__title" tabindex="-1">${project.title}</h1>
                </div>
            </div>
            <div class="detail-body">
                <p class="detail-description">${project.description}</p>
                <div class="detail-tags uk-flex uk-flex-wrap uk-gap-small">
                    ${tagsHtml}
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
