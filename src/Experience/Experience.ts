// src/Experience/Experience.ts
import * as THREE from 'three'
import { Sizes } from './Sizes'
import { Time } from './Time'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import { World } from './World/World'
import { PostProcessing } from './PostProcessing'
import { SmoothScroll } from './SmoothScroll'
import { TextReveal } from './TextReveal'
import { ContentReveal } from './ContentReveal'
import { Cursor } from './Cursor'
import { input } from './Input'


export class Experience {
    static instance: Experience

    scene: THREE.Scene = new THREE.Scene()
    sizes: Sizes = new Sizes()
    time: Time = new Time()
    camera!: Camera
    renderer!: Renderer
    world!: World
    private smoothScroll!: SmoothScroll
    private postProcessing!: PostProcessing
    private textReveal!: TextReveal
    private contentReveal!: ContentReveal
    private cursor!: Cursor

    constructor() {
        if (Experience.instance) return Experience.instance
        Experience.instance = this

        this.camera = new Camera(this.sizes)
        this.renderer = new Renderer(this.sizes)
        this.world = new World()
        this.postProcessing = new PostProcessing()
        this.smoothScroll = new SmoothScroll()
        this.textReveal = new TextReveal()
        this.contentReveal = new ContentReveal()
        this.cursor = new Cursor()

        // update() больше не вызывается здесь!
    }

    // НОВЫЙ МЕТОД: Асинхронный запуск
    async init() {
        // Ждем инициализации рендерера (WebGPU backend)
        await this.renderer.init()

        // Скрываем экран загрузки
        const loader = document.getElementById('pageLoader')
        if (loader) {
            loader.style.opacity = '0'
            setTimeout(() => {
                loader.style.display = 'none'
            }, 500)
        }

        // Только после этого запускаем цикл анимации
        this.update()
    }

    update() {
        this.time.update()
        input.update()
        this.cursor.update()
        this.camera.update(this.time.delta / 1000)
        this.world.update()
        this.renderer.update(this.scene, this.camera.instance)
        requestAnimationFrame(() => this.update())
    }

    destroy() {
        this.world.destroy()
        this.postProcessing.destroy()
        this.smoothScroll.destroy()
        this.textReveal.destroy()
        this.contentReveal.destroy()
        this.cursor.destroy()
        this.renderer.instance.dispose()
    }
}

export const experience = new Experience()
