// src/Experience/TextReveal.ts

export class TextReveal {
    private observer!: IntersectionObserver

    constructor() {
        this.setup()
    }

    setup() {
        // 1. Wrap text in masks
        const titles = document.querySelectorAll('.studio-title')
        
        titles.forEach(title => {
            const titleElement = title as HTMLElement
            const text = titleElement.innerText
            titleElement.innerHTML = '' // Clear original text

            // Split by words for a more professional "studio" feel
            const words = text.split(' ')
            
            words.forEach((word: string) => {
                const mask = document.createElement('span')
                mask.classList.add('reveal-mask')
                
                const span = document.createElement('span')
                span.classList.add('reveal-text')
                span.innerText = word + '\u00A0'
                
                mask.appendChild(span)
                titleElement.appendChild(mask)
            })
        })


        // 2. Setup IntersectionObserver for animations
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const masks = entry.target.querySelectorAll('.reveal-mask')
                    masks.forEach((mask, index) => {
                        // Stagger the appearance of words
                        setTimeout(() => {
                            mask.classList.add('active')
                        }, index * 100)
                    })
                }
            })
        }, {
            threshold: 0.1
        })

        // Observe all titles
        document.querySelectorAll('.studio-title').forEach(title => {
            this.observer.observe(title)
        })
    }

    destroy() {
        this.observer.disconnect()
    }
}
