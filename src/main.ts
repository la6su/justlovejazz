// src/main.ts
import './assets/main.less'
import { UIManager } from './UI/UIManager'
import { Bootstrapper } from './core/Bootstrapper'

async function bootstrap() {
    try {
        // 1. Initialize UI Layer first
        const ui = new UIManager()
        await ui.init()

        // 2. Use Bootstrapper to wire the 3D Experience
        const experience = await Bootstrapper.init(ui)

        console.log('Application successfully bootstrapped')
    } catch (err) {
        console.error('Failed to initialize application:', err)
    }
}

bootstrap()
