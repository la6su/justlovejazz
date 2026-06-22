// src/core/ProgressManager.ts — localStorage-backed lesson progress tracking

interface LessonStatus {
  completed: boolean
  quizScore: number
  attempts: number
  lastAttempted: number
}

interface ProgressStore {
  [lessonId: string]: LessonStatus
}

export class ProgressManager {
  private static readonly STORAGE_KEY = 'jlz:progress'

  private getStore(): ProgressStore {
    try {
      const raw = localStorage.getItem(ProgressManager.STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  private save(store: ProgressStore): void {
    localStorage.setItem(ProgressManager.STORAGE_KEY, JSON.stringify(store))
  }

  getLessonStatus(id: string): LessonStatus {
    const store = this.getStore()
    return store[id] ?? { completed: false, quizScore: 0, attempts: 0, lastAttempted: 0 }
  }

  saveQuizResult(lessonId: string, score: number, isCorrect: boolean): void {
    const store = this.getStore()
    const existing = store[lessonId] ?? { completed: false, quizScore: 0, attempts: 0, lastAttempted: 0 }
    store[lessonId] = {
      completed: isCorrect,
      quizScore: score,
      attempts: existing.attempts + 1,
      lastAttempted: Date.now(),
    }
    this.save(store)
  }

  reset(): void {
    localStorage.removeItem(ProgressManager.STORAGE_KEY)
  }

  getAll(): ProgressStore {
    return this.getStore()
  }

  isUnlocked(prerequisiteId?: string): boolean {
    if (!prerequisiteId) return true
    const prev = this.getLessonStatus(prerequisiteId)
    return prev.completed
  }
}

export const progressManager = new ProgressManager()
