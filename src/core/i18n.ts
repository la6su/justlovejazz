// src/core/i18n.ts — Internationalization (EN/RU). The typed locale port.
//
// This module is the single locale read point for scene and UI code:
//   - `getLang(): Lang` and `t(key): string` are pull-based reads, so the
//     current language is decided at each use site (the Phase 5 swap to
//     typed Vue state only changes this module's source);
//   - `toggleLang()` is the sole writer; it persists to localStorage and
//     publishes the `jlz:lang-change` push event for the consumers that must
//     re-render (scene textures, noise text, meta tags).
// It is already unit-locked (`src/__tests__/i18n.test.ts`), including the
// EN/RU dictionary parity guard.
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

import { eventBus } from './EventBus'

export type Lang = 'EN' | 'RU'

const STORAGE_KEY = 'jlz:lang'

// ── Translation dictionaries ──
const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  EN: {
    // Splash

    // Navigation
    'nav.studio': 'Studio',
    'nav.services': 'Services',
    'nav.works': 'Works',
    'nav.manifesto': 'Manifesto',
    'nav.lab': 'Lab',
    'nav.contact': 'Contact',
    'nav.blog': 'Blog',

    // Navigation sheet (section 5)
    'blog.undercurrent.title': 'Undercurrent',
    'blog.glass.title': 'Glassmorphism',
    'blog.rendering.title': 'On-demand Rendering',

    // Menu section (section 5, two-column navigation template)
    'menu.navigate': 'Menu',

    // Cinematic shell + contact finale
    'story.hint': 'Scroll · swipe',
    'story.contact': 'Contact',
    'contactFooter.kicker': 'Final frame · open channel',
    'contactFooter.title': 'Let’s make something worth remembering.',
    'contactFooter.lead': 'Tell us where the story should go next.',
    'contactFooter.telegram': 'TG',

    // Navigation submenu section titles and subtitles.
    // Works page section titles are project names (proper nouns), so they are not translated;
    // so only subtitles get keys for works.
    'dropbar.home.s1.title': 'Studio',
    'dropbar.home.s2.title': 'Services',
    'dropbar.home.s3.title': 'Works',
    'dropbar.home.s4.title': 'Manifesto',
    'dropbar.services.s1.title': 'Creative Direction',
    'dropbar.services.s2.title': 'Realtime build',
    'dropbar.services.s3.title': 'Motion',
    'dropbar.services.s4.title': 'AI',
    // Works page — project names stay English because they are proper nouns.
    'dropbar.manifesto.s1.title': 'Purpose',
    'dropbar.manifesto.s2.title': 'Clarity',
    'dropbar.manifesto.s3.title': 'Emotion',
    'dropbar.manifesto.s4.title': 'Simplicity',
    'dropbar.contact.s1.title': 'Email',
    'dropbar.contact.s2.title': 'Social',
    'dropbar.contact.s3.title': 'Location',
    'dropbar.contact.s4.title': 'Form',

    // Common CTAs
    'common.explore': 'Explore',

    // Home — intro (Studio)
    'home.studio.title': 'Studio',
    'home.studio.lead': 'Remote · EU · since 2019.',
    'home.studio.desc1': 'Interfaces and realtime scenes that make a product legible.',
    'home.studio.desc2': 'Strategy, design and WebGPU in one system.',
    'home.studio.showreel': 'Showreel',

    // Home — about (Services)
    'home.about.title': 'Services',
    'home.about.lead': 'From strategy to implementation.',
    'home.about.desc1': 'A brief becomes an interface people can move through.',
    'home.about.desc2': 'Direction · product design · realtime build.',

    // Home — works
    'home.works.title': 'Works',

    // Home — contact (Manifesto face)
    'home.manifesto.title': 'Manifesto',
    'home.manifesto.lead': 'This is what guides us.',
    'home.manifesto.desc1': 'Clarity before spectacle.',
    'home.manifesto.desc2': 'Every effect must explain a state.',
    'home.manifesto.desc3': 'Every page must earn attention.',

    // Home — Contact

    // Home — lab

    // Services page
    'services.creativeDirection.title': 'Creative Direction',
    'services.creativeDirection.lead': 'Find the point of view before the system takes shape.',
    'services.creativeDirection.statement':
      'A useful identity gives every later decision a direction.',
    'services.interactiveDev.title': 'Realtime build',
    'services.interactiveDev.lead': 'The interface wakes exactly when the story moves.',
    'services.interactiveDev.caption': 'Render only when there is something to say.',
    'services.motionRealtime.title': 'Motion',
    'services.motionRealtime.lead': 'Direction, not decoration.',
    'services.motionRealtime.word1': 'Context',
    'services.motionRealtime.word2': 'Impulse',
    'services.motionRealtime.word3': 'Calm',
    'services.aiSystems.title': 'AI systems',
    'services.aiSystems.lead':
      'Use new tools to open options, then bring judgement back to the work.',
    'services.aiSystems.statement':
      'The right workflow creates more room for the decisions that cannot be automated.',
    'services.aiSystems.action': 'Start a project',
    'services.aiSystems.note': 'A short brief is enough to begin the conversation.',

    // Works page — section headers (project names stay English — proper nouns)
    'works.observatory': 'An observatory of ideas.',
    'works.enterCase': 'Inside the project',
    'works.viewMaterial': 'View material',
    'works.experiment': 'Selected work / art direction + creative development',
    'works.continue': 'Scroll to the next world ↓',
    'works.archive': 'The archive',
    'works.room1.premise': 'How can a car become the only thing in the frame?',
    'works.room1.context':
      'Porsche 911 Spider: light, silhouette and movement build a focused CG presence.',
    'works.room2.premise': 'Can form, texture and light hold one mood?',
    'works.room2.context':
      'Alise: a CG image system where material and measured movement form one character.',
    'works.room3.premise': 'How can a cosmetics product feel clear and close?',
    'works.room3.context':
      '19 Lab: a product website that makes care, detail and brand character easy to read.',
    'works.room4.premise': 'What makes a specialised store easy to choose from?',
    'works.room4.context':
      'Pro193: an online store for tall men, centred on fit, clothing and a clear path to product.',
    'works.enterRooms': 'Explore the four rooms',
    'works.roomHint': 'Scroll to explore · Select a work to enter',
    'works.section1.title': 'Motion & CG',
    'works.section2.title': 'Motion & CG',
    'works.section3.title': 'Product website',
    'works.section4.title': 'E-commerce',

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
    'manifesto.emotion.lead': 'We use motion, light and interaction to create a sense of presence.',
    'manifesto.simplicity.title': 'Simplicity',
    'manifesto.simplicity.lead': 'We strive for minimalism — but not emptiness.',

    // Lab page
    'lab.shaderLab.title': 'Shader Lab',
    'lab.shaderLab.lead': 'GLSL & TSL fragments.',
    'lab.shaderLab.desc1': 'Glass, iridescence, fluid simulation.',
    'lab.shaderLab.desc2': 'Every visual effect starts here.',
    'lab.shaderLab.mode': 'TSL material study',
    'lab.audioReactive.title': 'Audio Reactive',
    'lab.audioReactive.lead': 'Web Audio → visuals.',
    'lab.audioReactive.desc1': 'Frequency-driven visuals.',
    'lab.audioReactive.desc2': 'Real-time analyser pipeline.',
    'lab.audioReactive.mode': 'Web Audio input',
    'lab.generative.title': 'Generative',
    'lab.generative.lead': 'Procedural worlds.',
    'lab.generative.desc1': 'Noise and math.',
    'lab.generative.desc2': 'Infinite variation from code.',
    'lab.generative.mode': 'Procedural system',
    'lab.gpuParticles.title': 'GPU Particles',
    'lab.gpuParticles.lead': '10k instanced points.',
    'lab.gpuParticles.desc1': 'On-demand rendering.',
    'lab.gpuParticles.desc2': 'Zero idle draw calls.',
    'lab.gpuParticles.mode': 'Performance study',
    'lab.sceneState': 'Isolated scene · in development',
    'lab.readNote': 'Read development note',

    // Contact page
    'contact.email.title': 'Email',
    'contact.email.heading': 'Start here.',
    'contact.email.meta': 'For new work, questions and good ideas.',
    'contact.social.title': 'Social',
    'contact.social.lead': 'Find us',
    'contact.social.heading': 'Keep in touch.',
    'contact.social.telegram': 'The quickest way to start.',
    'contact.social.github': 'Open work and experiments.',
    'contact.location.title': 'Location',
    'contact.location.heading': 'Find us here.',
    'contact.location.caption': 'A quiet base in the Troodos mountains.',
    'contact.form.title': 'Start',
    'contact.form.heading': 'Make the move.',
    'contact.form.action': 'Start a project',
    'contact.form.meta': 'We will return with the right next question.',

    // Secret-section hints

    // Navigation help labels

    // Meta (route-based SEO)
    'meta.home.title': 'JUSTLOVEJAZZ — Web Design Studio | Interactive 3D Portfolio',
    'meta.home.description':
      'JUSTLOVEJAZZ — interactive 3D portfolio experience. WebGPU/WebGL cinematic, Three.js TSL, UIkit 3.',
    'meta.services.title': 'Services — JUSTLOVEJAZZ',
    'meta.services.description':
      'Creative direction, interactive development, motion & realtime, and AI systems. From concept to implementation.',
    'meta.works.title': 'Works — JUSTLOVEJAZZ',
    'meta.works.description':
      'Selected projects and case studies. WebGPU fluid simulations, audio-reactive 3D, generative typography, and more.',
    'meta.manifesto.title': 'Manifesto — JUSTLOVEJAZZ',
    'meta.manifesto.description':
      'Purpose, clarity, emotion, simplicity. The principles that guide our work.',
    'meta.lab.title': 'Lab — JUSTLOVEJAZZ',
    'meta.lab.description':
      'Experiments in shaders, audio-reactive visuals, generative worlds, and GPU particles. Always in progress.',
    'meta.contact.title': 'Contact — JUSTLOVEJAZZ',
    'meta.contact.description':
      'Get in touch. Email, Telegram, GitHub. Remote · EU · open for new projects.',
  },

  RU: {
    // Splash

    // Navigation
    'nav.studio': 'Студия',
    'nav.services': 'Услуги',
    'nav.works': 'Работы',
    'nav.manifesto': 'Манифест',
    'nav.lab': 'Лаборатория',
    'nav.contact': 'Контакты',
    'nav.blog': 'Блог',

    // Navigation section (RU)
    'blog.undercurrent.title': 'Undercurrent',
    'blog.glass.title': 'Glassmorphism',
    'blog.rendering.title': 'Рендеринг по требованию',

    // Menu overlay (RU)
    'menu.navigate': 'Меню',

    // Cinematic shell + contact finale
    'story.hint': 'Листайте · свайпайте',
    'story.contact': 'Связаться',
    'contactFooter.kicker': 'Финальный кадр · открытый канал',
    'contactFooter.title': 'Давайте создадим то, что хочется запомнить.',
    'contactFooter.lead': 'Расскажите, куда должна продолжиться эта история.',
    'contactFooter.telegram': 'TG',

    // Lab section (RU)
    // Navigation submenu section titles and subtitles.
    // Works page section titles are project names (proper nouns), so they are not translated;
    // so only subtitles get keys for works.
    'dropbar.home.s1.title': 'Студия',
    'dropbar.home.s2.title': 'Услуги',
    'dropbar.home.s3.title': 'Работы',
    'dropbar.home.s4.title': 'Манифест',
    'dropbar.services.s1.title': 'Креатив',
    'dropbar.services.s2.title': 'Realtime',
    'dropbar.services.s3.title': 'Моушн',
    'dropbar.services.s4.title': 'AI',
    // Works page — project names stay English because they are proper nouns.
    'dropbar.manifesto.s1.title': 'Цель',
    'dropbar.manifesto.s2.title': 'Ясность',
    'dropbar.manifesto.s3.title': 'Эмоция',
    'dropbar.manifesto.s4.title': 'Простота',
    'dropbar.contact.s1.title': 'Почта',
    'dropbar.contact.s2.title': 'Соцсети',
    'dropbar.contact.s3.title': 'Локация',
    'dropbar.contact.s4.title': 'Форма',

    // Common CTAs
    'common.explore': 'Исследовать',

    // Home — intro (Studio)
    'home.studio.title': 'Студия',
    'home.studio.lead': 'Удалённо · ЕС · с 2019.',
    'home.studio.desc1': 'Интерфейсы и realtime-сцены, делающие продукт понятным.',
    'home.studio.desc2': 'Стратегия, дизайн и WebGPU — одна система.',
    'home.studio.showreel': 'Шоурил',

    // Home — about (Services)
    'home.about.title': 'Услуги',
    'home.about.lead': 'От стратегии до реализации.',
    'home.about.desc1': 'Из брифа — в интерфейс, по которому хочется двигаться.',
    'home.about.desc2': 'Направление · дизайн · realtime-разработка.',

    // Home — works
    'home.works.title': 'Работы',

    // Home — contact (Manifesto face)
    'home.manifesto.title': 'Манифест',
    'home.manifesto.lead': 'То, что нами движет.',
    'home.manifesto.desc1': 'Ясность важнее зрелищности.',
    'home.manifesto.desc2': 'Каждый эффект объясняет состояние.',
    'home.manifesto.desc3': 'Каждая страница заслуживает внимание.',

    // Home — Contact

    // Home — lab

    // Services page
    'services.creativeDirection.title': 'Креатив',
    'services.creativeDirection.lead': 'Найти точку зрения до того, как сложится система.',
    'services.creativeDirection.statement':
      'Рабочая идентичность задаёт направление каждому следующему решению.',
    'services.interactiveDev.title': 'Realtime',
    'services.interactiveDev.lead': 'Интерфейс просыпается ровно тогда, когда движется история.',
    'services.interactiveDev.caption': 'Рендерить, только когда есть что сказать.',
    'services.motionRealtime.title': 'Моушн',
    'services.motionRealtime.lead': 'Направление, не декорация.',
    'services.motionRealtime.word1': 'Контекст',
    'services.motionRealtime.word2': 'Импульс',
    'services.motionRealtime.word3': 'Покой',
    'services.aiSystems.title': 'AI-системы',
    'services.aiSystems.lead': 'Открывать новые варианты и возвращать суждение человека в работу.',
    'services.aiSystems.statement':
      'Правильный процесс освобождает место для решений, которые нельзя автоматизировать.',
    'services.aiSystems.action': 'Начать проект',
    'services.aiSystems.note': 'Для начала разговора достаточно короткого брифа.',

    // Works page — section headers
    'works.observatory': 'Обсерватория идей.',
    'works.enterCase': 'Внутри проекта',
    'works.viewMaterial': 'Смотреть материал',
    'works.experiment': 'Избранная работа / арт-дирекшн + разработка',
    'works.continue': 'Дальше — другой мир ↓',
    'works.archive': 'Архив',
    'works.room1.premise': 'Как сделать автомобиль единственным героем кадра?',
    'works.room1.context':
      'Porsche 911 Spider: свет, силуэт и движение создают собранное CG-присутствие.',
    'works.room2.premise': 'Могут ли форма, фактура и свет удержать одно настроение?',
    'works.room2.context':
      'Alise: CG-система, где материал и сдержанное движение собирают один характер.',
    'works.room3.premise': 'Как сделать косметический продукт понятным и близким?',
    'works.room3.context': '19 Lab: сайт о продукте, заботе, деталях и характере бренда.',
    'works.room4.premise': 'Что делает специализированный магазин понятным с первого шага?',
    'works.room4.context':
      'Pro193: интернет-магазин для высоких мужчин, построенный вокруг посадки, вещей и ясного выбора.',
    'works.enterRooms': 'Войти в четыре комнаты',
    'works.roomHint': 'Листайте комнаты · Откройте работу',
    'works.section1.title': 'Моушн и CG',
    'works.section2.title': 'Моушн и CG',
    'works.section3.title': 'Продуктовый сайт',
    'works.section4.title': 'E-commerce',

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
    'manifesto.emotion.lead':
      'Мы используем движение, свет и взаимодействие, чтобы создать чувство присутствия.',
    'manifesto.simplicity.title': 'Простота',
    'manifesto.simplicity.lead': 'Мы стремимся к минимализму — но не к пустоте.',

    // Lab page
    'lab.shaderLab.title': 'Шейдерная лаборатория',
    'lab.shaderLab.lead': 'GLSL и TSL фрагменты.',
    'lab.shaderLab.desc1': 'Стекло, иридесценция, симуляция жидкостей.',
    'lab.shaderLab.desc2': 'Каждый визуальный эффект начинается здесь.',
    'lab.shaderLab.mode': 'Исследование TSL-материалов',
    'lab.audioReactive.title': 'Аудио-реактивность',
    'lab.audioReactive.lead': 'Web Audio → визуал.',
    'lab.audioReactive.desc1': 'Частотно-управляемая графика.',
    'lab.audioReactive.desc2': 'Реалтайм анализатор.',
    'lab.audioReactive.mode': 'Ввод Web Audio',
    'lab.generative.title': 'Генеративное',
    'lab.generative.lead': 'Процедурные миры.',
    'lab.generative.desc1': 'Шум и математика.',
    'lab.generative.desc2': 'Бесконечное разнообразие из кода.',
    'lab.generative.mode': 'Процедурная система',
    'lab.gpuParticles.title': 'GPU-частицы',
    'lab.gpuParticles.lead': '10k инстансированных точек.',
    'lab.gpuParticles.desc1': 'Рендеринг по требованию.',
    'lab.gpuParticles.desc2': 'Ноль холостых draw calls.',
    'lab.gpuParticles.mode': 'Исследование производительности',
    'lab.sceneState': 'Изолированная сцена · в разработке',
    'lab.readNote': 'Читать заметку разработки',

    // Contact page
    'contact.email.title': 'Почта',
    'contact.email.heading': 'Ну, здрасте `-)',
    'contact.email.meta': 'Для новых проектов, вопросов и хороших идей.',
    'contact.social.title': 'Соцсети',
    'contact.social.lead': 'Найдите нас',
    'contact.social.heading': 'Как дела?',
    'contact.social.telegram': 'Самый быстрый способ начать.',
    'contact.social.github': 'Открытые работы и эксперименты.',
    'contact.location.title': 'Локация',
    'contact.location.heading': 'Мы здесь.',
    'contact.location.caption': 'Тихая база в горах Троодос.',
    'contact.form.title': 'Старт',
    'contact.form.heading': 'Сделаем шаг.',
    'contact.form.action': 'Начать проект',
    'contact.form.meta': 'Вернёмся с правильным следующим вопросом.',

    // Secret-section hints

    // Navigation help labels

    // Meta (route-based SEO)
    'meta.home.title': 'JUSTLOVEJAZZ — Студия веб-дизайна | Интерактивное 3D-портфолио',
    'meta.home.description':
      'JUSTLOVEJAZZ — интерактивное 3D-портфолио. WebGPU/WebGL кинематографичность, Three.js TSL, UIkit 3.',
    'meta.services.title': 'Услуги — JUSTLOVEJAZZ',
    'meta.services.description':
      'Креатив, разработка, моушн, AI-системы. От концепции до реализации.',
    'meta.works.title': 'Работы — JUSTLOVEJAZZ',
    'meta.works.description':
      'Избранные проекты и кейсы. WebGPU симуляции жидкостей, аудио-реактивное 3D, генеративная типографика и другое.',
    'meta.manifesto.title': 'Манифест — JUSTLOVEJAZZ',
    'meta.manifesto.description':
      'Цель, ясность, эмоция, простота. Принципы, направляющие нашу работу.',
    'meta.lab.title': 'Лаборатория — JUSTLOVEJAZZ',
    'meta.lab.description':
      'Эксперименты с шейдерами, аудио-реактивной графикой, генеративными мирами и GPU-частицами. Всегда в процессе.',
    'meta.contact.title': 'Контакты — JUSTLOVEJAZZ',
    'meta.contact.description':
      'Свяжитесь с нами. Почта, Telegram, GitHub. Удалённо · ЕС · открыты для новых проектов.',
  },
}

let currentLang: Lang = 'EN'

/** Initialize i18n — load saved language, apply translations. */
export function initI18n(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'RU') currentLang = 'RU'
  } catch {
    /* ignore */
  }
  applyTranslations()
}

/** Get current language. */
export function getLang(): Lang {
  return currentLang
}

/** Toggle EN ↔ RU. */
export function toggleLang(): Lang {
  currentLang = currentLang === 'EN' ? 'RU' : 'EN'
  try {
    localStorage.setItem(STORAGE_KEY, currentLang)
  } catch {
    /* ignore */
  }
  applyTranslations()
  eventBus.emit('jlz:lang-change', { lang: currentLang })
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
