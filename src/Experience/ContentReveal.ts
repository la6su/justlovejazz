// src/Experience/ContentReveal.ts
// Scroll-driven UI reveal + 3D section change integration.
// Listens for 'jlz:section-change' events from Experience to sync DOM
// section highlighting with the 3D world state.

export class ContentReveal {
    private observer!: IntersectionObserver;
    private sectionHandler: ((e: Event) => void) | null = null

    constructor() {
        this.setup();
        this.setupSectionSync();
    }

    setup() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const container = entry.target as HTMLElement;
                    const items = container.querySelectorAll('.reveal-item');

                    items.forEach((item, index) => {
                        setTimeout(() => {
                            item.classList.add('active');
                        }, index * 150); // Stagger delay
                    });
                }
            });
        }, {
            threshold: 0.1
        });

        // Observe sections that contain reveal-items
        document.querySelectorAll('section').forEach(section => {
            this.observer.observe(section);
        });
    }

    /**
     * Listen for 3D section changes from Experience.
     * When the 3D world transitions to a new section, highlight the
     * corresponding DOM section (data-section attribute matching).
     */
    private setupSectionSync() {
        this.sectionHandler = (e: Event) => {
            const detail = (e as CustomEvent).detail
            if (!detail?.sectionId) return
            // Remove 'active' from all DOM sections tagged with data-section.
            document.querySelectorAll<HTMLElement>('[data-section]').forEach(el => {
                el.classList.remove('section-active')
            })
            // Highlight matching DOM section.
            const matching = document.querySelector<HTMLElement>(
                `[data-section="${detail.sectionId}"]`
            )
            if (matching) {
                matching.classList.add('section-active')
            }
        }
        window.addEventListener('jlz:section-change', this.sectionHandler)
    }

    destroy() {
        this.observer.disconnect();
        if (this.sectionHandler) {
            window.removeEventListener('jlz:section-change', this.sectionHandler)
        }
    }
}
