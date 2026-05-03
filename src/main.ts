import './assets/main.less'
import { experience } from './Experience/Experience'

// Запускаем асинхронную инициализацию
experience.init().catch(err => {
    console.error('Failed to initialize Experience:', err)
})