// templates.ts — HTML string templates for SPA rendering.
import { getLesson, getAllLessons } from './Data/Lessons'

function sharedFooter(): string {
  return `\n    <footer id="section-contact" class="section-studio section-centered uk-flex uk-flex-middle" data-section="footer">\n      <div class="uk-container uk-text-center">\n        <span class="section-number">∞</span>\n        <h2 class="studio-title studio-title--medium uk-text-center">Start<br/><span>a Project</span></h2>\n        <p class="studio-text studio-text--meta">Direction · 3D · Frontend</p>\n        <div class="uk-margin-medium-top">\n          <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-secondary uk-button-large">hello@justlovejazz.com</a>\n        </div>\n      </div>\n    </footer>`
}
function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
export function homePage(): string {
  return `\n    <section id="section-hero" data-section="hero" class="section-studio section-hero uk-flex uk-flex-middle" uk-height-viewport>\n      <div class="uk-container uk-text-center">\n        <h1 class="studio-title studio-title--xl"><span class="studio-title__line">JUSTLOVEJAZZ</span></h1>\n        <p class="studio-tagline uk-margin-auto-center">Visual studio · Creative direction</p>\n      </div>\n    </section>\n    <section id="section-about" data-section="about" class="section-studio uk-flex uk-flex-middle" uk-height-viewport="expand:true">\n      <div class="uk-container">\n        <h2 class="studio-title uk-text-center studio-title--medium uk-margin-bottom">The Trinity</h2>\n        <div uk-grid class="uk-grid-small uk-child-width-1-3@m uk-child-width-1-1">\n          <div><span class="section-number">I</span><h3 class="studio-title studio-title--meta">Narrative</h3><p class="studio-text studio-text--meta">Scene-first thinking.</p></div>\n          <div><span class="section-number">II</span><h3 class="studio-title studio-title--meta">Runtime</h3><p class="studio-text studio-text--meta">One source of truth.</p></div>\n          <div><span class="section-number">III</span><h3 class="studio-title studio-title--meta">Operations</h3><p class="studio-text studio-text--meta">Lifecycle is a feature.</p></div>\n        </div>\n      </div>\n    </section>\n    <section id="section-works" data-section="works" class="section-studio section-works-slider" uk-height-viewport="expand:true">\n      <div id="gallery-anchor" data-role="3d-gallery"></div>\n    </section>\n    ${sharedFooter()}\n  `
}
export function renderLessonPage(lessonId: string): string {
  const lesson = getLesson(lessonId)
  if (!lesson) return `<div class="uk-container uk-padding-large"><h1>Lesson not found</h1><a href="#/lessons" class="uk-button uk-button-primary">Back to Lessons</a></div>`
  const chordTags = lesson.chords.map((c, i) => `<span class="jlz-chord${i === 0 ? ' jlz-chord--active' : ''}" data-chord-index="${i}">${esc(c)}</span>`).join(' ')
  const textBlocks = lesson.text.map((t, i) => `<p class="jlz-lesson-text-block" data-text-index="${i}">${esc(t)}</p>`).join('')
  let quizHtml = ''
  if (lesson.quiz) {
    const opts = lesson.quiz.options.map((o, i) => `<button class="jlz-quiz-option" data-option-index="${i}">${esc(o)}</button>`).join('\n      ')
    quizHtml = `\n      <div class="jlz-quiz" data-has-quiz="true">\n        <h3 class="jlz-quiz-question">${esc(lesson.quiz.question)}</h3>\n        <div class="jlz-quiz-options">\n          ${opts}\n        </div>\n        <div class="jlz-quiz-feedback" data-feedback></div>\n        <p class="jlz-quiz-explanation" data-explanation style="display:none">${esc(lesson.quiz.explanation)}</p>\n      </div>`
  }
  return `\n    <div class="jlz-lesson-page" data-lesson-id="${lesson.id}">\n      <div class="uk-container uk-padding-large">\n        <nav class="jlz-lesson-nav uk-margin-medium-bottom">\n          <a href="#" class="jlz-back-button uk-button uk-button-text" data-action="back">← Back</a>\n          <span class="jlz-lesson-nav-title">${esc(lesson.title)}</span>\n          <a href="#/lessons" class="uk-button uk-button-text">All Lessons</a>\n        </nav>\n        <div class="uk-margin-small">
          <span class="uk-badge uk-badge-${esc(lesson.difficulty ?? 'default')}">${esc(lesson.difficulty ?? 'beginner')}</span>
          ${lesson.duration ? `<span class="uk-margin-small-left">⏱ ${lesson.duration}min</span>` : ''}
        </div>\n        <h1 class="studio-title studio-title--large uk-margin-medium-top">${esc(lesson.title)}</h1>\n        <div class="jlz-chords uk-margin-large" role="group" aria-label="Chord progression">
          ${chordTags}
        </div>\n        <div class="jlz-lesson-content uk-margin-large-top">
          ${textBlocks}
        </div>
        ${quizHtml}
\n        <div class="jlz-lesson-actions uk-margin-large-top">
          <button class="uk-button uk-button-primary" data-action="play-all">♫ Play Progression</button>
        </div>\n      </div>\n    </div>`
}
export function renderLessonsList(): string {
  const lessons = getAllLessons()
  const cards = lessons.map((l) => `\n    <a href="#/lesson/${l.id}" class="jlz-lesson-card uk-card uk-card-default uk-card-body" data-lesson-id="${l.id}">\n      <div class="jlz-lesson-card-header">\n        <h3 class="uk-card-title uk-margin-remove-bottom">${esc(l.title)}</h3>
        <div class="uk-margin-small-top">\n          <span class="uk-badge uk-badge-${esc(l.difficulty ?? 'default')}">${esc(l.difficulty ?? 'beginner')}</span>\n          ${l.duration ? `<span class="uk-margin-small-left">⏱ ${l.duration}min</span>` : ''}\n        </div>\n      </div>\n      <div class="uk-margin-small-top"><span class="uk-text-muted">${esc(l.chords.join(' → '))}</span></div>
      <div class="jlz-lesson-card-status uk-margin-small-top"><span class="status-text">Not started</span></div>\n    </a>`).join('\n    ')
  return `\n    <div class="jlz-lessons-list">\n      <div class="uk-container uk-padding-large">\n        <nav class="uk-margin-medium-bottom"><a href="#" class="uk-button uk-button-text" data-action="back">← Home</a></nav>\n        <h1 class="studio-title studio-title--large uk-margin-medium-bottom">Jazz Lessons</h1>\n        <p class="uk-text-muted uk-margin-medium-bottom">Interactive jazz theory — chords, progressions, quizzes.</p>\n        <div uk-grid class="uk-grid-match uk-child-width-1-2@m uk-child-width-1-1">${cards}\n        </div>\n      </div>\n    </div>`
}
export interface PageData { intro: string; body: string; section2: string; footer: string }
export interface PageLayout { title: string; sections: PageData }
export const PAGES: Record<string, () => PageLayout> = { home: () => ({ title: 'JUSTLOVEJAZZ', sections: { intro: '', body: '', section2: '', footer: '' } }) }
export function renderPage(): string { return homePage() }
