// src/components/LessonPage.ts — runtime JS for lesson pages (DOM interaction)
import { getLesson, type Quiz } from '../Data/Lessons'
import { progressManager } from '../core/ProgressManager'

export function bindLessonPage(): void {
  const root = document.querySelector('.jlz-lesson-page')
  if (!root) return
  const lessonId = (root as HTMLElement).dataset.lessonId!
  const lesson = getLesson(lessonId)
  if (!lesson) return

  // Back
  const backBtn = root.querySelector('[data-action="back"]')
  if (backBtn) {
    ;(backBtn as HTMLElement).addEventListener('click', (e) => {
      e.preventDefault()
      window.history.back()
    })
  }

  // Quiz
  if (lesson.quiz) {
    bindQuiz(root as HTMLElement, lesson.quiz, lessonId)
  }
}

function bindQuiz(root: HTMLElement, quiz: Quiz, lessonId: string): void {
  const btns = Array.from(root.querySelectorAll('.jlz-quiz-option'))
  if (btns.length === 0) return

  const feedback = root.querySelector('[data-feedback]')
  const explanation = root.querySelector('[data-explanation]')

  btns.forEach((btn) => {
    ;(btn as HTMLElement).addEventListener('click', () => {
      const idx = parseInt((btn as HTMLElement).dataset.optionIndex!, 10)
      const correct = idx === quiz.correctIndex

      btns.forEach((b) => {
        const bIdx = parseInt((b as HTMLElement).dataset.optionIndex!, 10)
        b.classList.toggle('jlz-quiz-option--correct', bIdx === quiz.correctIndex)
        if (b === btn && !correct) {
          b.classList.add('jlz-quiz-option--wrong')
        }
        const hb = b as HTMLElement
        ;(hb as HTMLButtonElement).disabled = true
      })

      if (feedback) {
        ;(feedback as HTMLElement).textContent = correct ? '✓ Correct!' : '✗ Incorrect'
        ;(feedback as HTMLElement).className = correct
          ? 'jlz-quiz-feedback jlz-quiz-feedback--success'
          : 'jlz-quiz-feedback jlz-quiz-feedback--error'
      }
      if (explanation) {
        ;(explanation as HTMLElement).style.display = 'block'
      }

      progressManager.saveQuizResult(lessonId, correct ? 1 : 0, correct)
    })
  })
}
