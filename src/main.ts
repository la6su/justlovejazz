// src/main.ts
import './assets/main.less'
import { UIManager } from './UI/UIManager'
import { Experience } from './Experience/Experience'

async function bootstrap() {
    try {
        // 1. Initialize UI Layer first
        const ui = new UIManager()
        await ui.init()

        // 2. Initialize 3D Experience with UI dependency
        const experience = new Experience(ui)
        await experience.init()

        console.log('Application successfully bootstrapped')
    } catch (err) {
        console.error('Failed to initialize application:', err)
    }
}

bootstrap()
