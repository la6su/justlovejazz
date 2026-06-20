// src/Experience/ContentReveal.ts

export class ContentReveal {
    private observer!: IntersectionObserver;

    constructor() {
        this.setup();
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

    destroy() {
        this.observer.disconnect();
    }
}
