// src/core/i18n.ts — Internationalization (EN/RU).
//
// Simple translation system: t(key) returns translated string.
// Language toggle writes localStorage('jlz:lang') = 'EN' | 'RU'.
// data-i18n attributes on elements auto-translate on load + language change.
//
// Usage in templates:
//   <span data-i18n="explore">Explore</span>
//   t('explore') // → 'Explore' (EN) or 'Исследовать' (RU)

export type Lang = 'EN' | 'RU'

const STORAGE_KEY = 'jlz:lang'

// ── Translation dictionaries ──
const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  EN: {
    // Splash
    enter: 'Enter',
    loading: 'Loading',
    ready: 'Ready',
    // Navigation
    studio: 'Studio',
    services: 'Services',
    works: 'Works',
    manifesto: 'Manifesto',
    lab: 'Lab',
    contact: 'Contact',
    blog: 'Blog',
    // Section actions
    explore: 'Explore',
    readMore: 'Read more',
    startProject: 'Start a project',
    seeServices: 'See services',
    // Home sections
    studioLead: 'Remote · EU · since 2019.',
    studioDesc1: 'A small studio crafting expressive browser experiences.',
    studioDesc2: 'Glass · motion · light — powered by WebGPU.',
    // Services
    creativeDirection: 'Creative Direction',
    interactiveDev: 'Interactive Development',
    motionRealtime: 'Motion & Realtime',
    aiSystems: 'AI Systems',
    // Manifesto
    purpose: 'Purpose',
    clarity: 'Clarity',
    emotion: 'Emotion',
    simplicity: 'Simplicity',
    // Contact
    email: 'Email',
    social: 'Social',
    location: 'Location',
    form: 'Form',
    // Process
    discover: 'Discover',
    design: 'Design',
    develop: 'Develop',
    ship: 'Ship',
  },
  RU: {
    // Splash
    enter: 'Войти',
    loading: 'Загрузка',
    ready: 'Готово',
    // Navigation
    studio: 'Студия',
    services: 'Услуги',
    works: 'Работы',
    manifesto: 'Манифест',
    lab: 'Лаборатория',
    contact: 'Контакты',
    blog: 'Блог',
    // Section actions
    explore: 'Исследовать',
    readMore: 'Подробнее',
    startProject: 'Начать проект',
    seeServices: 'Смотреть услуги',
    // Home sections
    studioLead: 'Удалённо · ЕС · с 2019.',
    studioDesc1: 'Небольшая студия, создающая выразительные браузерные опыты.',
    studioDesc2: 'Стекло · движение · свет — на WebGPU.',
    // Services
    creativeDirection: 'Креативное направление',
    interactiveDev: 'Интерактивная разработка',
    motionRealtime: 'Движение и реальное время',
    aiSystems: 'ИИ-системы',
    // Manifesto
    purpose: 'Цель',
    clarity: 'Ясность',
    emotion: 'Эмоция',
    simplicity: 'Простота',
    // Contact
    email: 'Почта',
    social: 'Соцсети',
    location: 'Локация',
    form: 'Форма',
    // Process
    discover: 'Исследование',
    design: 'Дизайн',
    develop: 'Разработка',
    ship: 'Релиз',
  },
}

let currentLang: Lang = 'EN'

/** Initialize i18n — load saved language, apply translations. */
export function initI18n(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'RU') currentLang = 'RU'
  } catch { /* ignore */ }
  applyTranslations()
}

/** Get current language. */
export function getLang(): Lang {
  return currentLang
}

/** Toggle EN ↔ RU. */
export function toggleLang(): Lang {
  currentLang = currentLang === 'EN' ? 'RU' : 'EN'
  try { localStorage.setItem(STORAGE_KEY, currentLang) } catch { /* ignore */ }
  applyTranslations()
  window.dispatchEvent(new CustomEvent('jlz:lang-change', { detail: { lang: currentLang } }))
  return currentLang
}

/** Translate a key. Returns key itself if not found. */
export function t(key: string): string {
  return TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS.EN?.[key] ?? key
}

/** Apply translations to all [data-i18n] elements in the document. */
export function applyTranslations(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    if (key) el.textContent = t(key)
  })
}
