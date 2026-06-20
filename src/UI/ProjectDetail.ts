// src/UI/ProjectDetail.ts
import UIkit from 'uikit'
import { type Project } from '../core/types'

export class ProjectDetail {
  private readonly modal: HTMLElement | null
  private readonly content: HTMLElement | null
  private instance: ReturnType<typeof UIkit.modal> | null = null
  /** Called when the modal is hidden (Esc / bg click) → trigger card collapse. */
  public onClose: (() => void) | null = null
  private isOpen = false

  constructor() {
    this.modal = document.getElementById('project-modal')
    this.content = document.getElementById('modal-content')
    if (this.modal) {
      this.modal.addEventListener('hidden', () => {
        if (!this.isOpen) return
        this.isOpen = false
        this.onClose?.()
      })
    }
  }

  async open(project: Project): Promise<void> {
    if (!this.modal || !this.content) return
    const slug = project.slug || project.id
    const detailUrl = project.detailTextureUrl || project.textureUrl

    // Fullscreen modal: background texture covers entire screen, content
    // panel sits on top with blur backdrop for readability.
    this.content.innerHTML = `
      <div class="jlz-detail-root" style="background-image: url('${detailUrl}')">
        <div class="jlz-detail-scrim"></div>
        <div class="jlz-detail-content">
          <button class="jlz-detail-close" type="button" aria-label="Close detail" uk-close></button>
          <div class="jlz-detail-meta">
            <span class="jlz-detail-year">${project.year ?? ''}</span>
            <span class="jlz-detail-category">${project.category ?? ''}</span>
          </div>
          <h2 class="jlz-detail-title">${project.title}</h2>
          <p class="jlz-detail-description">${project.description || ''}</p>
          <div class="jlz-detail-tags">
            ${(project.tags ?? []).filter(Boolean).map(t => `<span class="jlz-detail-tag">${t}</span>`).join('')}
          </div>
          <div class="jlz-detail-cta">
            <a class="uk-button uk-button-primary" href="/projects/${slug}.html">Open Full Case →</a>
          </div>
        </div>
      </div>
    `
    this.modal.removeAttribute('aria-hidden')
    this.modal.setAttribute('aria-modal', 'true')
    this.instance = UIkit.modal(this.modal, { bgClose: true, escClose: true })
    this.instance?.show()
    this.isOpen = true

    // Wire close button.
    const closeBtn = this.content.querySelector<HTMLElement>('.jlz-detail-close')
    closeBtn?.addEventListener('click', () => this.close())

    const focusable = this.content.querySelector<HTMLElement>('button, a, [tabindex]')
    focusable?.focus()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.instance?.hide()
    if (this.modal) {
      this.modal.setAttribute('aria-hidden', 'true')
      this.modal.removeAttribute('aria-modal')
    }
    if (this.content) this.content.innerHTML = ''
  }

  get visible(): boolean { return this.isOpen }
}
