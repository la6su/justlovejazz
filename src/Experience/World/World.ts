import { Background } from './Background'

export class World {
    background: Background

    constructor() {
        this.background = new Background()
    }

    update() {
        this.background.update()
    }
}