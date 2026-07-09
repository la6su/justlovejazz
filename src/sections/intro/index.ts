// src/sections/intro/index.ts — unified section: 3D scene + HTML template
//
// Re-exports the 3D scene group creator and HTML template string.
// SectionSceneFactory imports the 3D creator; pages import the template.

export { createSection1 } from './scene'
export { introSection } from './template'
