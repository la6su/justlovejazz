# Alpha Handler Plan — Lesson Page (`lesson` route)

> Status: Draft → Awaiting Approval
> Target: /src/pages/LessonsPage.tsx, /src/pages/LessonPage.tsx (new), router, templates

## Context

- current: splash.ts → IntroSequence.ts + dissolveOverlay.ts
- new route: `#/lesson/[id]` → LessonPage.tsx (new)
- Assets are split: .ts (data) + /src/[....] (assets)
- tri: Jest + Playwright, no runtime: three.js 0.184 (WebGPU/WebGL), Tone.js 4.0+ (lazy)

## Phase 0: Prep (10 min)
- [ ] `bunx type-check` → green
- [ ] `bun run type-check` (noEmit)
- [ ] browser check localhost:5173 → all 3 current pages green ✅

## Phase 1: Data Layer (15 min)

### 1.1 src/Data/Lessons.ts — lessons data file (new)

```
const TEST_DATA: LessonContent[] = [
  {
    id: 'warm-up-1',
    title: 'Warm-up #1',
    chords: ['Cmaj7', 'Am7', 'Dm7', 'G7'],
    text: [
      'Welcome to Jazz Learning.',
      'Let\'s start with the most fundamental chord progression...',
    ],
    quiz: {
      question: 'What chord comes after Am7 in this progression?',
      options: ['Dm7', 'G7', 'Cmaj7'],
      correctIndex: 0,
      explanation: 'Dm7 is the iii chord that leads to G7.',
    },
  },
  // ... more lessons
];

export const LESSONS = [
  { id: 'warm-up-1', title: 'Warm-up #1', ... },
  // ...
];
export type { Lesson };
```

### 1.2 src/core/ProgressManager.ts — progress tracking (new)

```
class ProgressManager {
  private readonly STORAGE_KEY = 'jlz:progress';

  getLessonStatus(id: string): { completed: boolean; quizScore: number } {
    // localStorage read/write
  }

  saveQuizResult(lessonId: string, score: number): void { /* ... */ }
}

export const progressManager = new ProgressManager();
```

## Phase 2: Router + URLs (10 min)

### 2.1 router.ts — add lesson route

```ts
// src/router.ts
const ROUTES = { ... , lesson: { title: 'JUSTLOVEJAZZ — Lesson' } }

type PageKey = 'home' | 'trinity' | 'works' | 'lesson'

function toSpaKey(raw: ...): PageKey | `lesson/${id}` {
  // parse #/lesson/warm-up-1 → { page: 'lesson', id: 'warm-up-1' }
}
```

### 2.2 src/templates/lesson.ts — template

```ts
function renderLesson(lesson: LessonContent): string {
  return `<section class="jlz-lesson">
    <h1 class="jlz-lesson__title">${lesson.title}</h1>
    <div class="jlz-lesson__chords">${chordList}</div>
    <div class="jlz-lesson__text">${text}</div>
    <div class="jlz-lesson__quiz">${quiz}</div>
  </section>`;
}
```

## Phase 3: Component — LessonPage.tsx (new) (25 min)

### 3.1 Core structure

```
LessonPage wraps a single lesson:
  ├── LessonHeader (title, back button)
  ├── ChordDisplay (interactive chords)
  ├── LessonText (progressive text reveal)
  ├── QuizSection (MCQ with feedback)
  └── LessonProgress (localStorage indicator)
```

### 3.2 ChordDisplay — tone.js integration

```ts
// src/components/ChordDisplay.tsx
import * as Tone from 'tone';

class ChordDisplay {
  private synth: Tone.PolySynth | null = null;

  init() { /* Tone.getAudioContext(), Tone.start() */ }
  playChord(chord: string) { /* Tone.Player or synth trigger */ }
}
```

### 3.3 QuizSection

```ts
// Each quiz option clickable → check correctness
// On correct → success animation → progressManager.saveQuizResult()
// On wrong → shake animation → try again
```

## Phase 4: Lessons List — LessonsListPage.tsx (new) (15 min)

```
LessonsListPage wraps a list of available lessons:
  ├── LessonCard (id, title, status, locked/unlocked indicator)
  ├── ProgressIndicator (completed/attempted icons)
  └── NextLessonButton (scroll to next lesson)
```

## Phase 5: Integration (20 min)

### 5.1 Wire up in entry-app.ts / main-app.ts

```ts
// After router init, listen for lesson navigation
window.addEventListener('jlj:navigate', (e: CustomEvent) => {
  if (e.detail.page === 'lesson') {
    loadLesson(e.detail.id);
  }
});
```

### 5.2 Tone.js lazy load

```ts
// Only load Tone.js when user first interacts with chords
const loadAudioEngine = async () => {
  const Tone = await import('tone');
  Tone.start();
  return Tone;
};
```

## Phase 6: Polish (15 min)

- [ ] CSS tokens for lesson-ui in src/styles/tokens.css
- [ ] Responsive: mobile → stacked, desktop → side-by-side
- [ ] A11y: keyboard nav, aria-labels, reduced-motion
- [ ] Loading state: placeholder chords/loading
- [ ] Error handling: missing assets, failed downloads

## Phase 7: Verify (10 min)

- [ ] type-check → green ✅
- [ ] build → green ✅
- [ ] browser: localhost lesson page works ✅
- [ ] Test: navigate to #/lesson/warm-up-1
- [ ] Test: chords play, quiz works, progress saves
- [ ] Playwright: smoke test passes ✅
