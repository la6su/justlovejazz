
export interface Project {
  id: string;
  title: string;
  description: string;
  textureUrl: string;
  detailTextureUrl: string;
  color: string;
  year: string;
  category: string;
  tags: string[];
  viewPosition: { x: number, y: number, z: number };
  viewLookAt: { x: number, y: number, z: number };
}

export const PROJECTS: Project[] = [
  {
    id: 'proj1',
    title: 'Quantum Flux',
    description: 'An exploration of digital fluidity and light.',
    textureUrl: '/assets/textures/proj1.jpg',
    detailTextureUrl: '/assets/textures/proj1_detail.jpg',
    color: '#ff3300',
    year: '2024',
    category: 'Generative',
    tags: ['WebGPU', 'TSL', 'Procedural'],
    viewPosition: { x: -4, y: 1, z: 5 },
    viewLookAt: { x: -4, y: 0, z: 0 },
  },
  {
    id: 'proj2',
    title: 'Neon Silence',
    description: 'Capturing the stillness of futuristic cities.',
    textureUrl: '/assets/textures/proj2.jpg',
    detailTextureUrl: '/assets/textures/proj2_detail.jpg',
    color: '#00ffcc',
    year: '2023',
    category: 'Atmospheric',
    tags: ['Cinema', 'Lighting', 'Urban'],
    viewPosition: { x: 0, y: 1, z: 5 },
    viewLookAt: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'proj3',
    title: 'Aether Drift',
    description: 'The intersection of organic and synthetic forms.',
    textureUrl: '/assets/textures/proj3.jpg',
    detailTextureUrl: '/assets/textures/proj3_detail.jpg',
    color: '#aa00ff',
    year: '2024',
    category: 'Abstract',
    tags: ['Organic', 'Synthetic', 'Flow'],
    viewPosition: { x: 4, y: 1, z: 5 },
    viewLookAt: { x: 4, y: 0, z: 0 },
  },
  {
    id: 'proj4',
    title: 'Void Echo',
    description: 'A study on emptiness and resonance.',
    textureUrl: '/assets/textures/proj4.jpg',
    detailTextureUrl: '/assets/textures/proj4_detail.jpg',
    color: '#ffff00',
    year: '2022',
    category: 'Minimalist',
    tags: ['Void', 'Sound', 'Echo'],
    viewPosition: { x: 8, y: 1, z: 5 },
    viewLookAt: { x: 8, y: 0, z: 0 },
  }
];
