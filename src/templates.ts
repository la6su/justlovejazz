// templates.ts — HTML string templates for SPA rendering.
import { getLesson, getAllLessons } from './Data/Lessons'

// HTML escaping
function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// 6 sections: intro, about, flexible, challenge, innovative, contact
export function homePage(): string {
  return `
    <!-- ═══ section-studio → 6 child sections ═══ -->
    <div class="section-studio uk-position-relative">

      <!-- 1: Intro — White BG, metal drop -->
      <section class="uk-height-viewport" uk-height-viewport="expand: true" 
               id="section-intro" data-section="intro">
        <div class="section-bg section-bg--hero uk-flex uk-flex-middle uk-flex-center" data-dynamic-content>
          <div class="section-container uk-height-viewport" uk-scrollspy="cls: fade-in-up; delay: 100; repeat: true" aria-label="Studio">
            <div class="section-content uk-text-center">
              <h1 class="uk-h1" data-content-id="hero-title">JUSTLOVEJAZZ</h1>
              <p class="uk-text-meta" data-content-id="hero-subtitle">INTERACTIVE 3D WEB EXPERIENCE</p>
            </div>
            <div class="section-nav">
              <svg class="scroll-indicator" viewBox="0 0 100 300" aria-hidden="true">
                <g><circle cx='50' cy='288' r='12' fill='none' stroke='currentColor' stroke-width='1'><animate attributeName='r' dur='3s' repeatCount='indefinite' values='0; 15; 0' /></circle></g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- 2: About — Black BG, blob character -->
      <section class="uk-height-viewport" uk-height-viewport="expand: true"
               id="section-about" data-section="about">
        <div class="section-bg section-bg--about uk-flex uk-flex-middle uk-flex-center" data-dynamic-content>
          <div class="section-container uk-height-viewport" uk-scrollspy="cls: fade-in-up; delay: 100; repeat: true" aria-label="About">
            <div class="section-content uk-text-center">
              <p class="uk-text-meta uk-margin-large-top" data-content-id="about-text"></p>
            </div>
          </div>
        </div>
      </section>

      <!-- 3: Flexible — Light transition -->
      <section class="uk-height-viewport" uk-height-viewport="expand: true"
               id="section-flexible" data-section="flexible">
        <div class="section-bg section-bg--flexible uk-flex uk-flex-middle uk-flex-center" data-dynamic-content>
          <div class="section-container uk-height-viewport" uk-scrollspy="cls: fade-in-up; delay: 100; repeat: true" aria-label="Flexible">
            <div class="section-content uk-text-center">
              <h2 class="uk-h2" data-content-id="flexible-title">FLEXIBLE</h2>
            </div>
          </div>
        </div>
      </section>

      <!-- 4: Challenge — Dark, checkered floor, gallery -->
      <section class="uk-height-viewport" uk-height-viewport="expand: true"
               id="section-challenge" data-section="challenge">
        <div class="section-bg section-bg--challenge uk-flex uk-flex-middle uk-flex-center" data-dynamic-content>
          <div class="section-container uk-height-viewport" uk-scrollspy="cls: fade-in-up; delay: 100; repeat: true" aria-label="Challenge">
            <div class="section-content uk-text-center">
              <h2 class="uk-h2" data-content-id="challenge-title">CHALLENGE</h2>
            </div>
          </div>
          <div id="project-overlay" class="uk-position-z-index:999" uk-scrollspy="cls: fade-in-up; delay: 100; repeat: true"></div>
        </div>
      </section>

      <!-- 5: Innovative — Dark, constellation -->
      <section class="uk-height-viewport" uk-height-viewport="expand: true"
               id="section-innovative" data-section="innovative">
        <div class="section-bg section-bg--innovative uk-flex uk-flex-middle uk-flex-center" data-dynamic-content>
          <div class="section-container uk-height-viewport" uk-scrollspy="cls: fade-in-up; delay: 100; repeat: true" aria-label="Innovative">
            <div class="section-content uk-text-center">
              <h2 class="uk-h2" data-content-id="innovative-title">INNOVATIVE</h2>
            </div>
          </div>
        </div>
      </section>

      <!-- 6: Contact — Dark, noisy blocks -->
      <section class="uk-height-viewport" uk-height-viewport="expand: true"
               id="section-contact" data-section="contact">
        <div class="section-bg section-bg--contact uk-flex uk-flex-middle uk-flex-center" data-dynamic-content>
          <div class="section-container uk-height-viewport" uk-scrollspy="cls: fade-in-up; delay: 100; repeat: true" aria-label="Contact">
            <div class="section-content uk-text-center">
              <h2 class="uk-h2" data-content-id="contact-title">CONTACT</h2>
              <div class="uk-grid uk-margin-large-top" data-content-id="contact-grid"></div>
            </div>
          </div>
        </div>
      </section>

    </div>
  `
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
  return `\n    <div class="jlz-lessons-list">\n      <div class="uk-container uk-padding-large">\n        <nav class="uk-margin-medium-bottom"><a href="#" class="uk-button uk-button-text" data-action="back">← Home</a></nav>\n        <h1 class="studio-title studio-title--large uk-margin-medium-bottom">Jazz Lessons</h1>\n        <p class="uk-text-muted uk-margin-medium-bottom">Interactive jazz theory — chords, progressions, quizzes.</p>\n        <div class="uk-margin-medium-bottom">\n          <input class="uk-search uk-search-default uk-search-navbar" data-lesson-search placeholder="Search lessons..." type="search"/>\n        </div>\n        <div uk-grid class="uk-grid-match uk-child-width-1-2@m uk-child-width-1-1">${cards}\n        </div>\n      </div>\n    </div>`
}
export interface PageData { intro: string; body: string; section2: string; footer: string }
export interface PageLayout { title: string; sections: PageData }
export const PAGES: Record<string, () => PageLayout> = { home: () => ({ title: 'JUSTLOVEJAZZ', sections: { intro: '', body: '', section2: '', footer: '' } }) }
export function renderPage(): string { return homePage() }
