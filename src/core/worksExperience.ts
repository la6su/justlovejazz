/** Authored exhibition order shared by semantic Vue routes and the scene. */
export const WORKS_ROOMS = [
  { projectIndex: 0, relatedIndex: 1, signal: 0x79c0ff, rotation: -0.35 },
  { projectIndex: 1, relatedIndex: 2, signal: 0xe3bd7c, rotation: 0.4 },
  { projectIndex: 4, relatedIndex: 5, signal: 0x929bff, rotation: 1.1 },
  { projectIndex: 6, relatedIndex: 7, signal: 0x6dd5bc, rotation: 1.8 },
] as const

// Vue owns route intent. The scene consumes this typed port, never DOM or URL.
let caseProject: number | null = null
export function setWorksCaseProject(index: number | null): void {
  caseProject = index
}
export function getWorksCaseProject(): number | null {
  return caseProject
}
