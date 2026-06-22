// src/components/LessonsListPage.ts — bind progress status on lessons list cards
import { progressManager } from '../core/ProgressManager'

export function bindLessonsList(): void {
  const store = progressManager.getAll()

  const cards = Array.from(document.querySelectorAll('.jlz-lesson-card'))
  cards.forEach((card) => {
    const el = card as HTMLElement
    const lessonId = el.dataset.lessonId ?? ''
    const status = store[lessonId]
    const statusText = el.querySelector('.status-text') as HTMLElement | null

    if (statusText) {
      if (status?.completed) {
        statusText.textContent = '✓ Completed'
        statusText.classList.add('jlz-status--completed')
      } else if (status) {
        statusText.textContent = status.attempts > 0 ? 'In progress' : 'Not started'
        statusText.classList.toggle('jlz-status--in-progress', status.attempts > 0)
      }
    }

    const backBtn = el.querySelector('[data-action="back"]')
    if (backBtn) {
      ;(backBtn as HTMLElement).addEventListener('click', (e) => {
        e.preventDefault()
        window.history.back()
      })
    }
  })
}
