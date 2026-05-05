// src/main.ts
import './assets/main.less'
import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { experience } from './Experience/Experience'

// Initialize UIkit
UIkit.use(Icons)

// Запускаем асинхронную инициализацию
try {
   await experience.init()
} catch (err) {
   console.error('Failed to initialize Experience:', err)
}