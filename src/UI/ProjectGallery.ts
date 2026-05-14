import { PROJECTS, type Project } from '../Data/Projects'
import { GalleryManager } from '../core/GalleryManager'

export class ProjectGallery {
    private container: HTMLElement
    private list: HTMLElement
    private previewImage: HTMLImageElement
    private previewTitle: HTMLElement
    private previewMeta: HTMLElement
    private previewDescription: HTMLElement
    private items: HTMLButtonElement[] = []
    private pointerX = 0
    private pointerY = 0
    private onProjectHover?: (project: Project) => void
    private onProjectLeave?: () => void
    private onProjectClick?: (project: Project) => void
    private suppressScrollSyncUntil = 0
    private activeIndex = 0

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
        this.container.className = 'project-gallery works-sticky'

        this.container.innerHTML = `
          <div class="works-sticky__grid">
            <div class="works-list" role="listbox" aria-label="Projects" tabindex="0">
            </div>
            <aside class="works-preview" aria-live="polite">
              <div class="works-preview__media">
                <img class="works-preview__image" alt="" />
              </div>
              <div class="works-preview__content">
                <span class="works-preview__meta"></span>
                <h3 class="works-preview__title"></h3>
                <p class="works-preview__description"></p>
              </div>
            </aside>
          </div>
        `

        const list = this.container.querySelector('.works-list')
        const previewImage = this.container.querySelector('.works-preview__image')
        const previewTitle = this.container.querySelector('.works-preview__title')
        const previewMeta = this.container.querySelector('.works-preview__meta')
        const previewDescription = this.container.querySelector('.works-preview__description')

        if (!list || !previewImage || !previewTitle || !previewMeta || !previewDescription) {
            throw new Error('ProjectGallery: required sticky works nodes are missing')
        }

        this.list = list as HTMLElement
        this.previewImage = previewImage as HTMLImageElement
        this.previewTitle = previewTitle as HTMLElement
        this.previewMeta = previewMeta as HTMLElement
        this.previewDescription = previewDescription as HTMLElement

        this.render()
        this.bindPointerParallax()
        this.bindKeyboardNavigation()

        const worksSection = document.getElementById('works')
        if (worksSection) {
            worksSection.appendChild(this.container)
        } else {
            document.body.appendChild(this.container)
        }
    }

    private render() {
        this.list.innerHTML = ''
        this.items = []

        PROJECTS.forEach((project, index) => {
            const item = document.createElement('button')
            item.type = 'button'
            item.className = 'works-list__item'
            item.id = `works-item-${project.id}`
            item.setAttribute('role', 'option')
            item.setAttribute('aria-selected', index === 0 ? 'true' : 'false')
            item.style.setProperty('--accent-color', project.color)
            item.innerHTML = `
              <span class="works-list__index">${String(index + 1).padStart(2, '0')}</span>
              <span class="works-list__title">${project.title}</span>
              <span class="works-list__category">${project.category}</span>
            `

            item.addEventListener('mouseenter', () => {
                this.suppressScrollSyncUntil = performance.now() + 900
                this.setActiveIndex(index)
                this.onProjectHover?.(project)
            })
            item.addEventListener('focus', () => {
                this.suppressScrollSyncUntil = performance.now() + 900
                this.setActiveIndex(index)
            })
            item.addEventListener('mouseleave', () => {
                this.onProjectLeave?.()
            })
            item.addEventListener('click', (e) => {
                e.preventDefault()
                this.suppressScrollSyncUntil = performance.now() + 1200
                this.setActiveIndex(index)
                this.onProjectClick?.(project)
            })

            this.items.push(item)
            this.list.appendChild(item)
        })

        this.updatePreview(PROJECTS[0])
        this.list.setAttribute('aria-activedescendant', this.items[0]?.id ?? '')
    }

    private bindPointerParallax() {
        this.container.addEventListener('pointermove', (e) => {
            const rect = this.container.getBoundingClientRect()
            const nx = (e.clientX - rect.left) / Math.max(1, rect.width)
            const ny = (e.clientY - rect.top) / Math.max(1, rect.height)
            this.pointerX = (nx - 0.5) * 2
            this.pointerY = (ny - 0.5) * 2
        })

        this.container.addEventListener('pointerleave', () => {
            this.pointerX = 0
            this.pointerY = 0
        })
    }

    private setActiveIndex(index: number) {
        if (index < 0 || index >= PROJECTS.length) return
        this.activeIndex = index
        const project = PROJECTS[index]
        this.updatePreview(project)
        this.items.forEach((item, i) => {
            const active = i === index
            item.classList.toggle('is-active', active)
            item.setAttribute('aria-selected', active ? 'true' : 'false')
        })
        this.list.setAttribute('aria-activedescendant', this.items[index]?.id ?? '')
    }

    private updatePreview(project: Project) {
        this.previewImage.src = project.textureUrl
        this.previewImage.alt = project.title
        this.previewTitle.textContent = project.title
        this.previewMeta.textContent = `${project.year} — ${project.category}`
        this.previewDescription.textContent = project.description
        
        // Update link in preview
        const slug = project.slug || project.id
        this.previewDescription.innerHTML = `${project.description} <a href="/projects/${slug}.html" class="works-preview__link">Open Full Case →</a>`
    }

    public update(manager: GalleryManager) {
        const isDesktop = window.innerWidth >= 981
        if (isDesktop) {
            this.syncActiveFromScroll(manager)
        }

        if (!manager.isTransitioning && manager.activeIndex !== this.activeIndex) {
            this.setActiveIndex(manager.activeIndex)
        }

        const v = Math.max(-1, Math.min(1, manager.smoothedVelocity * 0.07))
        const tx = isDesktop ? this.pointerX * 8 + v * -18 : 0
        const ty = isDesktop ? this.pointerY * 6 : 0
        this.previewImage.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(1.06)`
    }

    private bindKeyboardNavigation(): void {
        this.list.addEventListener('keydown', (event: KeyboardEvent) => {
            const { key } = event
            if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End' && key !== 'Enter' && key !== ' ') {
                return
            }

            event.preventDefault()
            let next = this.activeIndex
            if (key === 'ArrowDown') next = Math.min(PROJECTS.length - 1, this.activeIndex + 1)
            if (key === 'ArrowUp') next = Math.max(0, this.activeIndex - 1)
            if (key === 'Home') next = 0
            if (key === 'End') next = PROJECTS.length - 1

            if (next !== this.activeIndex) {
                this.suppressScrollSyncUntil = performance.now() + 1200
                this.setActiveIndex(next)
                this.items[next]?.focus()
                window.experience?.galleryManager?.setProject(next)
            }

            if ((key === 'Enter' || key === ' ') && this.activeIndex >= 0) {
                this.onProjectClick?.(PROJECTS[this.activeIndex])
            }
        })
    }

    private syncActiveFromScroll(manager: GalleryManager): void {
        const now = performance.now()
        if (now < this.suppressScrollSyncUntil) return
        if (manager.isTransitioning) return

        const works = document.getElementById('works')
        if (!works) return
        const sectionRect = works.getBoundingClientRect()
        const isVisible = sectionRect.top < window.innerHeight * 0.85 && sectionRect.bottom > window.innerHeight * 0.2
        if (!isVisible) return

        let closestIndex = 0
        let closestDistance = Number.POSITIVE_INFINITY
        const focusY = window.innerHeight * 0.48

        this.items.forEach((item, index) => {
            const rect = item.getBoundingClientRect()
            const center = rect.top + rect.height * 0.5
            const distance = Math.abs(center - focusY)
            if (distance < closestDistance) {
                closestDistance = distance
                closestIndex = index
            }
        })

        if (closestIndex !== manager.activeIndex) {
            manager.setProject(closestIndex)
            this.setActiveIndex(closestIndex)
        }
    }

    public setVisible(visible: boolean) {
        this.container.style.visibility = visible ? 'visible' : 'hidden'
        this.container.style.opacity = visible ? '1' : '0'
        this.container.style.pointerEvents = visible ? 'auto' : 'none'
    }

    public setFocusedProject(projectId: string | null) {
        const idx = PROJECTS.findIndex((project) => project.id === projectId)
        if (idx >= 0) {
            this.suppressScrollSyncUntil = performance.now() + 450
            this.setActiveIndex(idx)
        }
    }
}
