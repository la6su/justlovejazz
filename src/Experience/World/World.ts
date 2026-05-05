// src/Experience/World/World.ts
import { Background } from './Background'
import { CentralObject } from './CentralObject'
import { Lights } from './Lights'

export class World {
    background: Background
    centralObject: CentralObject
    lights: Lights

    constructor() {
        this.background = new Background()
        this.lights = new Lights()
        this.centralObject = new CentralObject()
    }

    update() {
        this.background.update()
        this.centralObject.update()
    }

    destroy() {
        this.background.destroy()
        this.centralObject.destroy()
        this.lights.destroy()
    }
}
