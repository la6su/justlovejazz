// src/Experience/Cursor.ts

import { DeviceCapability } from '../core/DeviceCapability'

export class Cursor {
    private element: HTMLElement;
    private posX: number = 0;
    private posY: number = 0;
    private targetX: number = 0;
    private targetY: number = 0;
    private lerpFactor: number = 0.2; // Snappy feel
    private magneticElement: HTMLElement | null = null;
    private readonly mousemoveHandler: (e: MouseEvent) => void;
    private readonly mouseoverHandler: (e: MouseEvent) => void;
    private readonly mouseoutHandler: (e: MouseEvent) => void;

    constructor() {
        this.element = document.createElement('div');
        this.element.classList.add('custom-cursor');

        // Hide custom cursor on mobile/touch — it's useless and interferes.
        if (DeviceCapability.isMobile) {
            this.element.style.display = 'none'
        }

        document.body.appendChild(this.element);

        // Bound handlers for cleanup in destroy().
        this.mousemoveHandler = (e: MouseEvent) => {
            this.targetX = e.clientX;
            this.targetY = e.clientY;
        };
        this.mouseoverHandler = (e: MouseEvent) => {
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
        };
        this.mouseoutHandler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-magnetic]')) {
                this.magneticElement = null;
                this.element.classList.remove('magnetic');
            }
        };

        window.addEventListener('mousemove', this.mousemoveHandler);
        document.addEventListener('mouseover', this.mouseoverHandler);
        document.addEventListener('mouseout', this.mouseoutHandler);
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
        window.removeEventListener('mousemove', this.mousemoveHandler);
        document.removeEventListener('mouseover', this.mouseoverHandler);
        document.removeEventListener('mouseout', this.mouseoutHandler);
        this.element.remove();
    }
}
