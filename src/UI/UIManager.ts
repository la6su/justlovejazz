// src/UI/UIManager.ts
import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { ProjectDetail } from './ProjectDetail'
import { ProjectGallery } from './ProjectGallery'

export class UIManager {
    public projectDetail: ProjectDetail
    public projectGallery: ProjectGallery

    constructor() {
        // Initialize UIkit and Icons
        UIkit.use(Icons)
        
        // Ensure UIkit is on the window for any legacy/HTML-based components
        if (!(window as any).UIkit) {
            (window as any).UIkit = UIkit
        }

        // Initialize UI Components
        this.projectDetail = new ProjectDetail()
        
        // Note: ProjectGallery is initialized with callbacks that 
        // will be linked to Experience later or via an event bus.
        // For now, we'll allow Experience to pass its handlers.
        this.projectGallery = null as any 
    }

    /**
     * Configures the gallery with specific callbacks
     */
    setupGallery(callbacks: {
        onHover: (p: any) => void,
        onLeave: () => void,
        onClick: (p: any) => void
    }) {
        this.projectGallery = new ProjectGallery(callbacks)
    }

    async init() {
        // Any async initialization for UI can go here
        console.log('UIManager initialized')
    }

    public openProject(project: any) {
        this.projectDetail.open(project)
    }

    public closeProject() {
        this.projectDetail.close()
    }
}
