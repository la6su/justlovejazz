// src/Experience/Experience.ts
import * as THREE from 'three'
import { Sizes } from './Sizes'
import { Time } from './Time'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import { World } from './World/World'
import { Baku } from './World/Baku'
import { Environment } from './World/Environment'
import { PostProcessing } from './PostProcessing'
import { SmoothScroll } from './SmoothScroll'
import { TextReveal } from './TextReveal'
import { ContentReveal } from './ContentReveal'
import { Cursor } from './Cursor'
import { ProjectGallery } from '../UI/ProjectGallery'
import { ProjectDetail } from '../UI/ProjectDetail'
import { input } from './Input'


export class Experience {
    static instance: Experience

    scene: THREE.Scene = new THREE.Scene()
    sizes: Sizes = new Sizes()
    time: Time = new Time()
    camera!: Camera
    renderer!: Renderer
    world!: World
    baku!: Baku
    environment!: Environment
    private smoothScroll!: SmoothScroll
    private postProcessing!: PostProcessing
    private textReveal!: TextReveal
    private contentReveal!: ContentReveal
    private cursor!: Cursor
    private projectGallery!: ProjectGallery
    private projectDetail!: ProjectDetail

    constructor() {
        if (Experience.instance) return Experience.instance
        Experience.instance = this

        this.camera = new Camera(this.sizes)
        this.renderer = new Renderer(this.sizes)
        
        // World Orchestration
        this.world = new World(this.camera)
        this.baku = new Baku()
        this.scene.add(this.baku)
        this.environment = new Environment(this.scene)

        // Define cinematic path
        this.setupWorldSections()

        this.postProcessing = new PostProcessing()
        this.smoothScroll = new SmoothScroll()
        this.textReveal = new TextReveal()
        this.contentReveal = new ContentReveal()
        this.cursor = new Cursor()

        // Portfolio Gallery
        this.projectGallery = new ProjectGallery({
            onHover: (p) => this.handleProjectHover(p),
            onLeave: () => this.handleProjectLeave(),
            onClick: (p) => this.handleProjectClick(p)
        })
    }

    private setupWorldSections() {
        this.world.addSection({
            id: 'intro',
            cameraPosition: new THREE.Vector3(0, 0, 5),
            cameraTarget: new THREE.Vector3(0, 0, 0),
            fov: 75,
            bakuPosition: new THREE.Vector3(0, 0, 0),
            bakuRotation: new THREE.Quaternion(),
            bakuScale: new THREE.Vector3(1, 1, 1),
            bakuMaterial: {
                color: new THREE.Color(0x333333),
                emissive: new THREE.Color(0x111111),
                roughness: 0.1,
                metalness: 0.9
            },
            ambientColor: new THREE.Color(0x111122),
            lightIntensity: 2.0
        })

        this.world.addSection({
            id: 'explore',
            cameraPosition: new THREE.Vector3(3, 2, 3),
            cameraTarget: new THREE.Vector3(0, 0, 0),
            fov: 60,
            bakuPosition: new THREE.Vector3(0, 0, 0),
            bakuRotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)),
            bakuScale: new THREE.Vector3(1.2, 1.2, 1.2),
            bakuMaterial: {
                color: new THREE.Color(0x664422),
                emissive: new THREE.Color(0x221100),
                roughness: 0.4,
                metalness: 0.7
            },
            ambientColor: new THREE.Color(0x221100),
            lightIntensity: 5.0
        })

        this.world.addSection({
            id: 'detail',
            cameraPosition: new THREE.Vector3(0, 0, 2),
            cameraTarget: new THREE.Vector3(0, 0, 0),
            fov: 45,
            bakuPosition: new THREE.Vector3(0, 0, 0),
            bakuRotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
            bakuScale: new THREE.Vector3(0.8, 0.8, 0.8),
            bakuMaterial: {
                color: new THREE.Color(0x112233),
                emissive: new THREE.Color(0x001122),
                roughness: 0.05,
                metalness: 1.0
            },
            ambientColor: new THREE.Color(0x001122),
            lightIntensity: 1.0
        })
    }

    private handleProjectHover(project: any) {
        // 1. Change Baku's color to match the project
        this.baku.updateMaterial({
            color: new THREE.Color(project.color),
            emissive: new THREE.Color(project.color).multiplyScalar(0.5),
            roughness: 0.1,
            metalness: 1.0
        })

        // 2. Slight camera shift (Cinematic feel)
        this.camera.setBasePosition(new THREE.Vector3(0.5, 0.2, 4.5))
        this.camera.setFovOffset(5)
    }

    private handleProjectLeave() {
        // Reset camera and Baku will be handled by the world update loop
        this.camera.setBasePosition(new THREE.Vector3(0, 0, 5))
        this.camera.setFovOffset(0)
    }

    private handleProjectClick(project: any) {
        // 1. Trigger Cinematic Zoom
        this.camera.setBasePosition(new THREE.Vector3(0, 0, 2))
        this.camera.setFovOffset(-15)
        
        // 2. Open detail view after a slight delay to sync with camera movement
        setTimeout(() => {
            this.projectDetail.open(project)
        }, 600)

        console.log(`Transitioning to project: ${project.title}`)
    }


    // НОВЫЙ МЕТОД: Асинхронный запуск
    async init() {
        // Ensure UIkit is globally available
        if (!(window as any).UIkit) {
            console.warn('UIkit not found on window, attempting to initialize...')
        }

        this.projectDetail = new ProjectDetail()
        window.addEventListener('project-detail-closed', () => this.handleProjectLeave())

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

        // 1. World Orchestration: Map scroll to cinematic path
        const normalizedScroll = input.getSmoothedScroll() / 1000
        const worldState = this.world.update(normalizedScroll)

        if (worldState) {
            // Apply Baku transforms
            this.baku.position.copy(worldState.bakuPosition)
            this.baku.quaternion.copy(worldState.bakuRotation)
            this.baku.scale.copy(worldState.bakuScale)
            if (worldState.bakuMaterial) {
                this.baku.updateMaterial(worldState.bakuMaterial)
            }
            
            // Apply Environment transitions
            this.environment.setLighting(worldState.envColor, worldState.envIntensity)

            // Sync Project Gallery visibility with current section
            // Gallery should be visible in the 'explore' section
            this.projectGallery.setVisible(worldState.currentSectionId === 'explore')
        }

        // 2. Organic Motion & Env update
        this.camera.update(this.time.delta / 1000)
        this.baku.update(this.time.delta / 1000)
        this.environment.update(this.time.elapsed / 1000, normalizedScroll, this.camera.getVelocity(), this.baku.position)

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
