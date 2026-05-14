// src/UI/ProjectDetail.ts
import UIkit from 'uikit'
import { type Project } from '../core/types'

export class ProjectDetail {
  private readonly modal: HTMLElement | null
  private readonly content: HTMLElement | null
  private instance: ReturnType<typeof UIkit.modal> | null = null

  constructor() {
    this.modal = document.getElementById('project-modal')
    this.content = document.getElementById('modal-content')
  }

  async open(project: Project): Promise<void> {
    if (!this.modal || !this.content) return
    const slug = project.slug || project.id
    const detailUrl = project.detailTextureUrl || project.textureUrl
    this.content.innerHTML = `
      <div class="detail-hero">
        <div class="detail-hero__media">
          <img class="detail-hero__image" src="${detailUrl}" alt="${project.title}" loading="lazy" />
        </div>
        <div class="detail-hero__info">
          <div class="detail-hero__meta">
            <span class="detail-hero__year">${project.year ?? ''}</span>
            <span class="detail-hero__category">${project.category ?? ''}</span>
          </div>
          <h2 class="detail-hero__title">${project.title}</h2>
          <p class="studio-text studio-text--body">${project.description || ''}</p>
          <div class="detail-tags">
            ${(project.tags ?? []).filter(Boolean).map(t => `<span class="detail-tag">${t}</span>`).join('')}
          </div>
          <div class="uk-margin-medium-top">
            <a class="uk-button uk-button-primary" href="/projects/${slug}.html">Open Full Case →</a>
          </div>
        </div>
      </div>
    `
    this.instance = UIkit.modal(this.modal, { bgClose: true, escClose: true })
    this.instance?.show()
  }

  close(): void {
    this.instance?.hide()
    if (this.content) this.content.innerHTML = ''
  }
}
