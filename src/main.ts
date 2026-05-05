// src/main.ts
import './assets/main.less'
import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { experience } from './Experience/Experience'
import { cursor } from './Experience/Cursor'

// Initialize UIkit
UIkit.use(Icons)

// Cursor is already initialized via the import above (singleton)

// Запускаем асинхронную инициализацию
experience.init().catch(err => {
   console.error('Failed to initialize Experience:', err)
})
