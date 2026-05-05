// src/Data/Projects.ts

export interface Project {
    id: string;
    title: string;
    category: string;
    year: string;
    color: string;
    image: string;
    description: string;
    tags: string[];
}

export const PROJECTS: Project[] = [
    {
        id: 'quantum-echo',
        title: 'Quantum Echo',
        category: 'Generative Art',
        year: '2024',
        color: '#ff3e00',
        image: '/assets/projects/quantum-echo.jpg',
        description: 'An exploration of quantum superposition through real-time generative visuals.',
        tags: ['WebGL', 'TSL', 'Generative']
    },
    {
        id: 'neon-synthesis',
        title: 'Neon Synthesis',
        category: 'Interactive Experience',
        year: '2023',
        color: '#00ffcc',
        image: '/assets/projects/neon-synthesis.jpg',
        description: 'A synaptic journey through a neon-lit futuristic cityscape.',
        tags: ['Three.js', 'WebGPU', 'Audio-Reactive']
    },
    {
        id: 'void-walker',
        title: 'Void Walker',
        category: 'Cinematic Short',
        year: '2023',
        color: '#8800ff',
        image: '/assets/projects/void-walker.jpg',
        description: 'A minimalist study of light and shadow in an infinite void.',
        tags: ['Cinema 4D', 'Octane', 'Direction']
    },
    {
        id: 'chrono-flux',
        title: 'Chrono Flux',
        category: 'Brand Identity',
        year: '2024',
        color: '#ffff00',
        image: '/assets/projects/chrono-flux.jpg',
        description: 'Redefining the concept of time for a luxury watch manufacture.',
        tags: ['Branding', 'Motion Design', 'Typography']
    }
];
