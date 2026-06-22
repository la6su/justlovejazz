// src/Data/Lessons.ts — Lessons data source
// Self-contained lesson content: chords, text, quizzes, progressions.

export interface Quiz {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface LessonContent {
  id: string
  title: string
  chords: string[]
  text: string[]
  quiz?: Quiz
  duration?: number // estimated minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

const LESSONS: LessonContent[] = [
  {
    id: 'warm-up-1',
    title: 'Warm-up #1 — ii-V-I в Cmaj7',
    difficulty: 'beginner',
    duration: 5,
    chords: ['Cmaj7', 'Am7', 'Dm7', 'G7'],
    text: [
      'Welcome to Jazz Learning.',
      "Let's start with the most fundamental chord progression in jazz: the ii-V-I in C major.",
      'The progression moves through Am7 (ii), Dm7 (iii), G7 (V) → back to Cmaj7 (I).',
      'This is the bread and butter of jazz harmony.',
    ],
    quiz: {
      question: 'What chord comes after Am7 in this progression?',
      options: ['Dm7', 'G7', 'Cmaj7', 'Fmaj7'],
      correctIndex: 0,
      explanation: 'Dm7 is the iii chord that leads to G7 (V), then resolves back to Cmaj7 (I).',
    },
  },
  {
    id: 'blue-rhythm-1',
    title: 'Blue Rhythm #1 — Basic Swing',
    difficulty: 'beginner',
    duration: 8,
    chords: ['F7', 'Bb7', 'E7', 'A7'],
    text: [
      'Blues rhythm is the heartbeat of jazz.',
      'Start by feeling the swing: eighth notes played with a long-short groove.',
      'This progression uses dominant 7ths — the classic blues sound.',
    ],
    quiz: {
      question: 'What gives jazz its characteristic "swing" feel?',
      options: ['Straight quarter notes', 'Long-short eighth note patterns', 'Slow tempo only', 'Complex chords'],
      correctIndex: 1,
      explanation: 'Swing comes from playing eighth notes with a long-short (triplet-like) feel rather than straight even notes.',
    },
  },
  {
    id: 'chord-subs-1',
    title: 'Chord Substitutions #1 — Tritone',
    difficulty: 'intermediate',
    duration: 10,
    chords: ['C7', 'Gb7', 'Fmaj7'],
    text: [
      'Tritone substitution is one of the most powerful tools in jazz harmony.',
      'A dominant 7th can be replaced by another dominant 7th a tritone away.',
      'C7 and Gb7 share the same guide tones (E and Bb → same as Eb and Bb).',
      'This creates chromatic bass movement and fresh voicings.',
    ],
    quiz: {
      question: 'Why can C7 be replaced by Gb7?',
      options: [
        'They are in the same key',
        'They share the same guide tones (3rd and b7)',
        'Gb7 is a major chord',
        'C7 has no dominant function',
      ],
      correctIndex: 1,
      explanation: 'C7 (E, Bb) and Gb7 (Aa=Bb, E) share the same 3rd and b7, making them interchangeable as dominant chords.',
    },
  },
]

export { LESSONS }

export function getLesson(id: string): LessonContent | undefined {
  return LESSONS.find((l) => l.id === id)
}

export function getAllLessons(): readonly LessonContent[] {
  return LESSONS
}
