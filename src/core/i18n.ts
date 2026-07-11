// src/core/i18n.ts — Internationalization (EN/RU).
//
// Translation system: t(key) returns the translated string for the current
// language. data-i18n attributes on elements auto-translate on load, on
// language change, and on every route change (router calls applyTranslations
// after rendering new page HTML).
//
// Key naming convention (flat dot notation):
//   nav.*          — header nav labels
//   home.*         — home page cube-face sections (studio/services/works/...)
//   services.*     — services content page
//   works.*        — works content page (section titles; project names stay EN)
//   manifesto.*    — manifesto content page
//   lab.*          — lab content page
//   contact.*      — contact content page
//   meta.*         — per-page <title> + <meta description> (route-based SEO)
//   common.*       — shared CTAs (explore, readMore, send) + secret hints
//
// English text is always the default in templates (no-JS fallback).
// applyTranslations() only replaces textContent when a translation exists.

export type Lang = 'EN' | 'RU'

const STORAGE_KEY = 'jlz:lang'

// ── Translation dictionaries ──
const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  EN: {
    // Splash
    'splash.enter': 'Enter',
    'splash.loading': 'Loading',
    'splash.ready': 'Ready',

    // Navigation
    'nav.studio': 'Studio',
    'nav.services': 'Services',
    'nav.works': 'Works',
    'nav.manifesto': 'Manifesto',
    'nav.lab': 'Lab',
    'nav.contact': 'Contact',
    'nav.blog': 'Blog',

    // Common CTAs
    'common.explore': 'Explore',
    'common.readMore': 'Read more',
    'common.send': 'Send',
    'common.startProject': 'Start a project',
    'common.seeServices': 'See services',
    'common.email': 'Email',
    'common.telegram': 'Telegram',
    'common.github': 'GitHub',

    // Home — intro (Studio)
    'home.studio.title': 'Studio',
    'home.studio.lead': 'Remote · EU · since 2019.',
    'home.studio.desc1': 'A small studio crafting expressive browser experiences.',
    'home.studio.desc2': 'Glass · motion · light — powered by WebGPU.',

    // Home — about (Services)
    'home.about.title': 'Services',
    'home.about.lead': 'From strategy to implementation.',
    'home.about.desc1': 'We cover the full cycle of digital products.',
    'home.about.desc2': 'Explore our capabilities.',

    // Home — works
    'home.works.title': 'Works',
    'home.works.lead': 'Selected projects that define our way.',
    'home.works.desc1': 'Case studies.',
    'home.works.desc2': 'Process. Results.',

    // Home — contact (Manifesto face)
    'home.manifesto.title': 'Manifesto',
    'home.manifesto.lead': 'This is what guides us.',
    'home.manifesto.desc1': 'Our principles.',
    'home.manifesto.desc2': 'Our way of thinking.',
    'home.manifesto.desc3': 'Our promises.',

    // Home — process (Contact face)
    'home.contact.title': 'Contact',
    'home.contact.lead': "Let's create something great together.",
    'home.contact.tag': '@ justlovejazz',

    // Home — lab
    'home.lab.title': 'Lab',
    'home.lab.lead': 'Always in progress.',
    'home.lab.desc1': 'We explore.',
    'home.lab.desc2': 'We prototype.',
    'home.lab.desc3': 'We push boundaries.',

    // Services page
    'services.creativeDirection.title': 'Creative Direction',
    'services.creativeDirection.lead': 'From concept to visual identity.',
    'services.creativeDirection.desc1': 'We design interfaces that feel like digital products, not websites.',
    'services.creativeDirection.desc2': 'Every interaction has purpose.',
    'services.creativeDirection.desc3': 'Every transition tells a story.',
    'services.interactiveDev.title': 'Interactive Development',
    'services.interactiveDev.lead': 'Realtime experiences built with modern web technologies.',
    'services.interactiveDev.desc1': 'Performance comes first.',
    'services.interactiveDev.desc2': 'Motion follows purpose.',
    'services.motionRealtime.title': 'Motion & Realtime',
    'services.motionRealtime.lead': 'Motion is part of the interface. Not decoration.',
    'services.motionRealtime.desc1': 'Navigation.',
    'services.motionRealtime.desc2': 'Feedback.',
    'services.motionRealtime.desc3': 'Emotion.',
    'services.aiSystems.title': 'AI Systems',
    'services.aiSystems.lead': 'Creative workflows powered by AI.',
    'services.aiSystems.desc1': 'Generation.',
    'services.aiSystems.desc2': 'Automation.',
    'services.aiSystems.desc3': 'Iteration.',
    'services.lab.title': 'LAB',
    'services.lab.lead': 'Experiments. Always in progress.',
    'services.lab.desc1': 'A sandbox for shader, audio, and procedural R&D.',
    'services.playground.title': 'PLAYGROUND',
    'services.playground.lead': 'Nothing to sell. Just play.',
    'services.playground.desc1': 'Open experiments, half-broken demos, things we build for joy.',

    // Works page — section headers (project names stay English — proper nouns)
    'works.section1.title': 'Selected Works',
    'works.section1.lead': 'Projects that define our way.',
    'works.section2.title': 'Case Studies',
    'works.section2.lead': 'Process, craft, and results.',
    'works.section3.title': 'Experiments',
    'works.section3.lead': 'Where R&D meets production.',
    'works.section4.title': 'Recent',
    'works.section4.lead': 'The latest from the studio.',

    // Manifesto page
    'manifesto.purpose.title': 'Purpose',
    'manifesto.purpose.lead': "We don't build what everyone builds.",
    'manifesto.purpose.desc1': 'We solve different problems.',
    'manifesto.purpose.desc2': 'We improve experience and understand the pain.',
    'manifesto.clarity.title': 'Clarity',
    'manifesto.clarity.lead': 'Clean structure.',
    'manifesto.clarity.desc1': 'Clear logic.',
    'manifesto.clarity.desc2': 'No noise.',
    'manifesto.emotion.title': 'Emotion',
    'manifesto.emotion.lead': 'We use motion, light, and sound to evoke a sense of presence.',
    'manifesto.simplicity.title': 'Simplicity',
    'manifesto.simplicity.lead': 'We strive for minimalism — but not emptiness.',
    'manifesto.process.title': 'Process',
    'manifesto.process.lead': 'We explore. We prototype. We test. We fail. We improve.',
    'manifesto.future.title': 'Future',
    'manifesto.future.lead': 'Technologies change. Principles remain.',

    // Lab page
    'lab.shaderLab.title': 'Shader Lab',
    'lab.shaderLab.lead': 'GLSL & TSL fragments.',
    'lab.shaderLab.desc1': 'Glass, iridescence, fluid simulation.',
    'lab.shaderLab.desc2': 'Every visual effect starts here.',
    'lab.audioReactive.title': 'Audio Reactive',
    'lab.audioReactive.lead': 'Web Audio → visuals.',
    'lab.audioReactive.desc1': 'Frequency-driven visuals.',
    'lab.audioReactive.desc2': 'Real-time analyser pipeline.',
    'lab.generative.title': 'Generative',
    'lab.generative.lead': 'Procedural worlds.',
    'lab.generative.desc1': 'Noise and math.',
    'lab.generative.desc2': 'Infinite variation from code.',
    'lab.gpuParticles.title': 'GPU Particles',
    'lab.gpuParticles.lead': '10k instanced points.',
    'lab.gpuParticles.desc1': 'On-demand rendering.',
    'lab.gpuParticles.desc2': 'Zero idle draw calls.',

    // Contact page
    'contact.email.title': 'Email',
    'contact.email.lead': 'Direct line.',
    'contact.social.title': 'Social',
    'contact.social.lead': 'Find us elsewhere.',
    'contact.location.title': 'Location',
    'contact.location.lead': 'Where we work.',
    'contact.location.desc1': 'Remote · EU · since 2019',
    'contact.location.desc2': 'Open for new projects.',
    'contact.form.title': 'Form',
    'contact.form.lead': 'Tell us about your project.',
    'contact.form.placeholder': "What's the project?",

    // Secret-section hints
    'hint.returnLeft': '← Drag right to return',
    'hint.returnRight': 'Drag left to return →',

    // Meta (route-based SEO)
    'meta.home.title': 'JUSTLOVEJAZZ — Web Design Studio | Interactive 3D Portfolio',
    'meta.home.description': 'JUSTLOVEJAZZ — interactive 3D portfolio experience. WebGPU/WebGL cinematic, Three.js TSL, UIkit 3.',
    'meta.services.title': 'Services — JUSTLOVEJAZZ',
    'meta.services.description': 'Creative direction, interactive development, motion & realtime, and AI systems. From concept to implementation.',
    'meta.works.title': 'Works — JUSTLOVEJAZZ',
    'meta.works.description': 'Selected projects and case studies. WebGPU fluid simulations, audio-reactive 3D, generative typography, and more.',
    'meta.manifesto.title': 'Manifesto — JUSTLOVEJAZZ',
    'meta.manifesto.description': 'Purpose, clarity, emotion, simplicity. The principles that guide our work.',
    'meta.lab.title': 'Lab — JUSTLOVEJAZZ',
    'meta.lab.description': 'Experiments in shaders, audio-reactive visuals, generative worlds, and GPU particles. Always in progress.',
    'meta.contact.title': 'Contact — JUSTLOVEJAZZ',
    'meta.contact.description': 'Get in touch. Email, Telegram, GitHub. Remote · EU · open for new projects.',
  },

  RU: {
    // Splash
    'splash.enter': 'Войти',
    'splash.loading': 'Загрузка',
    'splash.ready': 'Готово',

    // Navigation
    'nav.studio': 'Студия',
    'nav.services': 'Услуги',
    'nav.works': 'Работы',
    'nav.manifesto': 'Манифест',
    'nav.lab': 'Лаборатория',
    'nav.contact': 'Контакты',
    'nav.blog': 'Блог',

    // Common CTAs
    'common.explore': 'Исследовать',
    'common.readMore': 'Подробнее',
    'common.send': 'Отправить',
    'common.startProject': 'Начать проект',
    'common.seeServices': 'Смотреть услуги',
    'common.email': 'Почта',
    'common.telegram': 'Telegram',
    'common.github': 'GitHub',

    // Home — intro (Studio)
    'home.studio.title': 'Студия',
    'home.studio.lead': 'Удалённо · ЕС · с 2019.',
    'home.studio.desc1': 'Небольшая студия, создающая выразительные браузерные опыты.',
    'home.studio.desc2': 'Стекло · движение · свет — на WebGPU.',

    // Home — about (Services)
    'home.about.title': 'Услуги',
    'home.about.lead': 'От стратегии до реализации.',
    'home.about.desc1': 'Мы покрываем полный цикл цифровых продуктов.',
    'home.about.desc2': 'Изучите наши возможности.',

    // Home — works
    'home.works.title': 'Работы',
    'home.works.lead': 'Избранные проекты, определяющие наш подход.',
    'home.works.desc1': 'Кейсы.',
    'home.works.desc2': 'Процесс. Результаты.',

    // Home — contact (Manifesto face)
    'home.manifesto.title': 'Манифест',
    'home.manifesto.lead': 'То, что нами движет.',
    'home.manifesto.desc1': 'Наши принципы.',
    'home.manifesto.desc2': 'Наш образ мысли.',
    'home.manifesto.desc3': 'Наши обещания.',

    // Home — process (Contact face)
    'home.contact.title': 'Контакты',
    'home.contact.lead': 'Давайте создадим что-то великое вместе.',
    'home.contact.tag': '@ justlovejazz',

    // Home — lab
    'home.lab.title': 'Лаборатория',
    'home.lab.lead': 'Всегда в процессе.',
    'home.lab.desc1': 'Мы исследуем.',
    'home.lab.desc2': 'Мы прототипируем.',
    'home.lab.desc3': 'Мы расширяем границы.',

    // Services page
    'services.creativeDirection.title': 'Креативное направление',
    'services.creativeDirection.lead': 'От концепции до визуальной идентичности.',
    'services.creativeDirection.desc1': 'Мы создаём интерфейсы, которые ощущаются как цифровые продукты, а не сайты.',
    'services.creativeDirection.desc2': 'Каждое взаимодействие имеет цель.',
    'services.creativeDirection.desc3': 'Каждый переход рассказывает историю.',
    'services.interactiveDev.title': 'Интерактивная разработка',
    'services.interactiveDev.lead': 'Реалтайм-опыт на современных веб-технологиях.',
    'services.interactiveDev.desc1': 'Производительность прежде всего.',
    'services.interactiveDev.desc2': 'Движение следует за целью.',
    'services.motionRealtime.title': 'Движение и реальное время',
    'services.motionRealtime.lead': 'Движение — часть интерфейса. Не декорация.',
    'services.motionRealtime.desc1': 'Навигация.',
    'services.motionRealtime.desc2': 'Отклик.',
    'services.motionRealtime.desc3': 'Эмоция.',
    'services.aiSystems.title': 'ИИ-системы',
    'services.aiSystems.lead': 'Креативные рабочие процессы на базе ИИ.',
    'services.aiSystems.desc1': 'Генерация.',
    'services.aiSystems.desc2': 'Автоматизация.',
    'services.aiSystems.desc3': 'Итерация.',
    'services.lab.title': 'ЛАБОРАТОРИЯ',
    'services.lab.lead': 'Эксперименты. Всегда в процессе.',
    'services.lab.desc1': 'Песочница для шейдеров, звука и процедурного R&D.',
    'services.playground.title': 'ПЛОЩАДКА',
    'services.playground.lead': 'Нечего продавать. Просто игра.',
    'services.playground.desc1': 'Открытые эксперименты, полу-сломанные демо, вещи, которые мы строим для радости.',

    // Works page — section headers
    'works.section1.title': 'Избранные работы',
    'works.section1.lead': 'Проекты, определяющие наш подход.',
    'works.section2.title': 'Кейсы',
    'works.section2.lead': 'Процесс, ремесло и результаты.',
    'works.section3.title': 'Эксперименты',
    'works.section3.lead': 'Где R&D встречается с продакшеном.',
    'works.section4.title': 'Недавнее',
    'works.section4.lead': 'Свежее из студии.',

    // Manifesto page
    'manifesto.purpose.title': 'Цель',
    'manifesto.purpose.lead': 'Мы не делаем то, что делают все.',
    'manifesto.purpose.desc1': 'Мы решаем другие задачи.',
    'manifesto.purpose.desc2': 'Мы улучшаем опыт и понимаем боль.',
    'manifesto.clarity.title': 'Ясность',
    'manifesto.clarity.lead': 'Чистая структура.',
    'manifesto.clarity.desc1': 'Чёткая логика.',
    'manifesto.clarity.desc2': 'Без шума.',
    'manifesto.emotion.title': 'Эмоция',
    'manifesto.emotion.lead': 'Мы используем движение, свет и звук, чтобы вызвать чувство присутствия.',
    'manifesto.simplicity.title': 'Простота',
    'manifesto.simplicity.lead': 'Мы стремимся к минимализму — но не к пустоте.',
    'manifesto.process.title': 'Процесс',
    'manifesto.process.lead': 'Мы исследуем. Мы прототипируем. Мы тестируем. Мы ошибаемся. Мы улучшаем.',
    'manifesto.future.title': 'Будущее',
    'manifesto.future.lead': 'Технологии меняются. Принципы остаются.',

    // Lab page
    'lab.shaderLab.title': 'Шейдерная лаборатория',
    'lab.shaderLab.lead': 'GLSL и TSL фрагменты.',
    'lab.shaderLab.desc1': 'Стекло, иридесценция, симуляция жидкостей.',
    'lab.shaderLab.desc2': 'Каждый визуальный эффект начинается здесь.',
    'lab.audioReactive.title': 'Аудио-реактивность',
    'lab.audioReactive.lead': 'Web Audio → визуал.',
    'lab.audioReactive.desc1': 'Частотно-управляемая графика.',
    'lab.audioReactive.desc2': 'Реалтайм анализатор.',
    'lab.generative.title': 'Генеративное',
    'lab.generative.lead': 'Процедурные миры.',
    'lab.generative.desc1': 'Шум и математика.',
    'lab.generative.desc2': 'Бесконечное разнообразие из кода.',
    'lab.gpuParticles.title': 'GPU-частицы',
    'lab.gpuParticles.lead': '10k инстансированных точек.',
    'lab.gpuParticles.desc1': 'Рендеринг по требованию.',
    'lab.gpuParticles.desc2': 'Ноль холостых draw calls.',

    // Contact page
    'contact.email.title': 'Почта',
    'contact.email.lead': 'Прямая линия.',
    'contact.social.title': 'Соцсети',
    'contact.social.lead': 'Найдите нас в других местах.',
    'contact.location.title': 'Локация',
    'contact.location.lead': 'Где мы работаем.',
    'contact.location.desc1': 'Удалённо · ЕС · с 2019',
    'contact.location.desc2': 'Открыты для новых проектов.',
    'contact.form.title': 'Форма',
    'contact.form.lead': 'Расскажите о своём проекте.',
    'contact.form.placeholder': 'Какой проект?',

    // Secret-section hints
    'hint.returnLeft': '← Тяните вправо для возврата',
    'hint.returnRight': 'Тяните влево для возврата →',

    // Meta (route-based SEO)
    'meta.home.title': 'JUSTLOVEJAZZ — Студия веб-дизайна | Интерактивное 3D-портфолио',
    'meta.home.description': 'JUSTLOVEJAZZ — интерактивное 3D-портфолио. WebGPU/WebGL кинематографичность, Three.js TSL, UIkit 3.',
    'meta.services.title': 'Услуги — JUSTLOVEJAZZ',
    'meta.services.description': 'Креативное направление, интерактивная разработка, движение и реальное время, ИИ-системы. От концепции до реализации.',
    'meta.works.title': 'Работы — JUSTLOVEJAZZ',
    'meta.works.description': 'Избранные проекты и кейсы. WebGPU симуляции жидкостей, аудио-реактивное 3D, генеративная типографика и другое.',
    'meta.manifesto.title': 'Манифест — JUSTLOVEJAZZ',
    'meta.manifesto.description': 'Цель, ясность, эмоция, простота. Принципы, направляющие нашу работу.',
    'meta.lab.title': 'Лаборатория — JUSTLOVEJAZZ',
    'meta.lab.description': 'Эксперименты с шейдерами, аудио-реактивной графикой, генеративными мирами и GPU-частицами. Всегда в процессе.',
    'meta.contact.title': 'Контакты — JUSTLOVEJAZZ',
    'meta.contact.description': 'Свяжитесь с нами. Почта, Telegram, GitHub. Удалённо · ЕС · открыты для новых проектов.',
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

/** Apply translations to all [data-i18n] elements in the document.
 *  Also handles data-i18n-placeholder for input placeholder attributes. */
export function applyTranslations(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    if (key) el.textContent = t(key)
  })
  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder')
    if (key && el instanceof HTMLInputElement) el.placeholder = t(key)
  })
}
