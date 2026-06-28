// src/UI/ProjectDetail.ts
// Cover transition for project detail — two panels slide in from top/bottom,
// meet at center, then reveal content. Close reverses the animation.
// Inspired by Codrops CoverPageTransition (simplified, no GSAP dependency).

import { type Project } from '../core/types'

export class ProjectDetail {
  private overlay: HTMLElement | null = null
  private topPanel: HTMLElement | null = null
  private bottomPanel: HTMLElement | null = null
  private content: HTMLElement | null = null
  private closeBtn: HTMLElement | null = null
  private isOpen = false
  private isAnimating = false
  public onClose: (() => void) | null = null

  constructor() {
    this.buildOverlay()
  }

  private buildOverlay(): void {
    this.overlay = document.createElement('div')
    this.overlay.className = 'jlz-cover-overlay'
    this.overlay.setAttribute('aria-hidden', 'true')
    this.overlay.style.cssText = `
      position:fixed;inset:0;z-index:4000;pointer-events:none;
      opacity:0;transition:opacity .3s ease;
    `
    this.topPanel = document.createElement('div')
    this.topPanel.className = 'jlz-cover-top'
    this.topPanel.style.cssText = `
      position:absolute;top:0;left:0;width:100%;height:50%;background:#050507;
      transform:translateY(-100%);transition:transform .5s cubic-bezier(.7,0,.3,1);
    `
    this.bottomPanel = document.createElement('div')
    this.bottomPanel.className = 'jlz-cover-bottom'
    this.bottomPanel.style.cssText = `
      position:absolute;bottom:0;left:0;width:100%;height:50%;background:#050507;
      transform:translateY(100%);transition:transform .5s cubic-bezier(.7,0,.3,1);
    `
    this.content = document.createElement('div')
    this.content.className = 'jlz-cover-content'
    this.content.style.cssText = `
      position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
      opacity:0;transition:opacity .3s ease .3s;padding:2rem;
    `
    this.overlay.appendChild(this.topPanel)
    this.overlay.appendChild(this.bottomPanel)
    this.overlay.appendChild(this.content)
    document.body.appendChild(this.overlay)
  }

  async open(project: Project): Promise<void> {
    if (this.isOpen || this.isAnimating) return
    this.isAnimating = true
    this.isOpen = true

    const slug = project.slug || project.id
    const detailUrl = project.detailTextureUrl || project.textureUrl

    this.content!.innerHTML = `
      <div class="jlz-detail-root" style="
        max-width:900px;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:2rem;
        background:rgba(10,10,15,.9);backdrop-filter:blur(20px);border-radius:12px;overflow:hidden;
      ">
        <div style="background-image:url('${detailUrl}');background-size:cover;background-position:center;min-height:400px;"></div>
        <div style="padding:2.5rem;display:flex;flex-direction:column;gap:1rem;">
          <button class="jlz-detail-close" type="button" aria-label="Close" style="
            position:absolute;top:1rem;right:1rem;background:none;border:none;color:#fff;
            font-size:1.5rem;cursor:pointer;padding:.5rem;
          ">✕</button>
          <div style="display:flex;gap:1rem;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#8090c0;">
            <span>${project.year ?? ''}</span>
            <span>·</span>
            <span>${project.category ?? ''}</span>
          </div>
          <h2 style="font-size:2rem;font-weight:900;margin:0;color:#fff;">${project.title}</h2>
          <p style="color:rgba(255,255,255,.7);line-height:1.6;margin:0;">${project.description || ''}</p>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:auto;">
            ${(project.tags ?? []).filter(Boolean).map((t: string) => `<span style="background:rgba(120,140,200,.15);color:#a0b0e0;padding:.25rem .75rem;border-radius:4px;font-size:.7rem;">${t}</span>`).join('')}
          </div>
          <a href="/projects/${slug}.html" style="color:#8090c0;text-decoration:none;font-size:.85rem;margin-top:1rem;">Open Full Case →</a>
        </div>
      </div>
    `

    this.closeBtn = this.content!.querySelector('.jlz-detail-close')
    this.closeBtn?.addEventListener('click', () => this.close())

    this.overlay!.style.opacity = '1'
    this.overlay!.style.pointerEvents = 'auto'
    this.overlay!.setAttribute('aria-hidden', 'false')

    // Animate panels in
    requestAnimationFrame(() => {
      this.topPanel!.style.transform = 'translateY(0)'
      this.bottomPanel!.style.transform = 'translateY(0)'
    })

    // Reveal content after panels meet
    setTimeout(() => {
      this.content!.style.opacity = '1'
      this.isAnimating = false
    }, 500)
  }

  close(): void {
    if (!this.isOpen || this.isAnimating) return
    this.isAnimating = true

    this.content!.style.opacity = '0'

    setTimeout(() => {
      this.topPanel!.style.transform = 'translateY(-100%)'
      this.bottomPanel!.style.transform = 'translateY(100%)'
    }, 200)

    setTimeout(() => {
      this.overlay!.style.opacity = '0'
      this.overlay!.style.pointerEvents = 'none'
      this.overlay!.setAttribute('aria-hidden', 'true')
      this.content!.innerHTML = ''
      this.isOpen = false
      this.isAnimating = false
      this.onClose?.()
    }, 700)
  }

  get visible(): boolean { return this.isOpen }
}
