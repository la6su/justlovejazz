// src/types/global.d.ts
import { Experience } from '../Experience/Experience'
import { UIManager } from '../UI/UIManager'

declare global {
  interface Window {
    experience: Experience
    UIkit: any
  }
}

export {}
