// src/Experience/Cursor.ts

export class Cursor {
    private element: HTMLElement;
    private posX: number = 0;
    private posY: number = 0;
    private targetX: number = 0;
    private targetY: number = 0;
    private lerpFactor: number = 0.2; // Snappy feel
    private magneticElement: HTMLElement | null = null;

    constructor() {
        this.element = document.createElement('div');
        this.element.classList.add('custom-cursor');
        document.body.appendChild(this.element);

        window.addEventListener('mousemove', (e) => {
            this.targetX = e.clientX;
            this.targetY = e.clientY;
        });

        this.initMagneticListeners();
    }

    private initMagneticListeners() {
        document.addEventListener('mouseover', (e) => {
            const target = e.target as HTMLElement;
            const magnetic = target.closest('[data-magnetic]');
            
            if (magnetic) {
                this.magneticElement = magnetic as HTMLElement;
                this.element.classList.add('magnetic');
            } else if (target.closest('a, button, .interactive')) {
                this.element.classList.add('hovering');
                this.element.classList.remove('magnetic');
            } else {
                this.element.classList.remove('magnetic', 'hovering');
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-magnetic]')) {
                this.magneticElement = null;
                this.element.classList.remove('magnetic');
            }
        });
    }

    update() {
        let finalX = this.targetX;
        let finalY = this.targetY;

        if (this.magneticElement) {
            const rect = this.magneticElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Calculate distance to center
            const distX = centerX - this.targetX;
            const distY = centerY - this.targetY;
            
            // Pull the cursor towards the center (Magnetic effect)
            // Only pull if the mouse is within a certain range of the element
            const pullStrength = 0.4;
            finalX = this.targetX + distX * pullStrength;
            finalY = this.targetY + distY * pullStrength;
        }

        // Smooth lerping
        this.posX += (finalX - this.posX) * this.lerpFactor;
        this.posY += (finalY - this.posY) * this.lerpFactor;

        this.element.style.transform = `translate(calc(${this.posX}px - 50%), calc(${this.posY}px - 50%))`;
    }

    destroy() {
        this.element.remove();
    }
}
