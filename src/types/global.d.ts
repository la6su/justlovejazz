// src/types/global.d.ts
import { Experience } from '../Experience/Experience';
import { UIManager } from '../UI/UIManager';

declare global {
  interface Window {
    experience: Experience;
    UIkit: any; // UIkit is a legacy JS library, usually any is acceptable or we can define the core methods
  }
}

export {};
