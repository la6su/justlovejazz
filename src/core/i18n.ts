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

    // Navigation sheet (section 5)
    'navOverlay.title': 'Navigate',
    'navOverlay.lead': 'Choose your destination.',
    'navOverlay.studio.desc': 'Home · cube experience',
    'navOverlay.services.desc': 'What we do',
    'navOverlay.works.desc': 'Selected projects',
    'navOverlay.manifesto.desc': 'Principles',
    'navOverlay.lab.desc': 'Experiments',
    'navOverlay.contact.desc': 'Start a project',
    'blog.undercurrent.title': 'Undercurrent',
    'blog.glass.title': 'Glassmorphism',
    'blog.rendering.title': 'On-demand Rendering',

    // Menu section (section 5, two-column navigation template)
    'menu.navigate': 'Navigate',
    'menu.stat.sections': 'LEMONROOM',

    // Cinematic shell + contact finale
    'story.system': 'Cinematic web system · 2026',
    'story.hint': 'Scroll · swipe',
    'story.bottomLabel': 'Field note',
    'story.contact': 'Contact',
    'contactFooter.kicker': 'Final frame · open channel',
    'contactFooter.title': 'Let’s make something worth remembering.',
    'contactFooter.lead': 'Tell us where the story should go next.',
    'contactFooter.telegram': 'TG',

    // Legacy Lab overlay keys retained for route/content compatibility.
    'labOverlay.title': 'Lab',
    'labOverlay.lead': 'Experiments · works · R&D.',
    'labOverlay.openWorks': 'Open works',

    // Navigation submenu section titles and subtitles.
    // Works page section titles are project names (proper nouns), so they are not translated;
    // so only subtitles get keys for works.
    'dropbar.home.s1.title': 'Studio',
    'dropbar.home.s1.subtitle': 'Remote · EU · since 2019',
    'dropbar.home.s2.title': 'Services',
    'dropbar.home.s2.subtitle': 'Strategy to implementation',
    'dropbar.home.s3.title': 'Works',
    'dropbar.home.s3.subtitle': 'Selected projects · gallery',
    'dropbar.home.s4.title': 'Manifesto',
    'dropbar.home.s4.subtitle': 'What guides us',
    'dropbar.home.featured.title': 'Lab',
    'dropbar.home.featured.subtitle': 'Experiments · always in progress',
    'dropbar.services.s1.title': 'Creative Direction',
    'dropbar.services.s1.subtitle': 'Concept → visual identity',
    'dropbar.services.s2.title': 'Realtime build',
    'dropbar.services.s2.subtitle': 'Realtime · performance-first',
    'dropbar.services.s3.title': 'Motion',
    'dropbar.services.s3.subtitle': 'Motion as interface',
    'dropbar.services.s4.title': 'AI',
    'dropbar.services.s4.subtitle': 'Generation · automation',
    'dropbar.services.featured.title': 'Start a project',
    'dropbar.services.featured.subtitle': 'Open for new work',
    // Works page — project names stay English because they are proper nouns.
    'dropbar.works.s1.subtitle': 'WebGPU fluid simulation',
    'dropbar.works.s2.subtitle': 'Minimal portfolio',
    'dropbar.works.s3.subtitle': 'Audio-reactive 3D',
    'dropbar.works.s4.subtitle': 'Generative typography',
    'dropbar.works.featured.title': 'Blog',
    'dropbar.works.featured.subtitle': 'Process notes + case studies',
    'dropbar.manifesto.s1.title': 'Purpose',
    'dropbar.manifesto.s1.subtitle': "We don't build what everyone builds",
    'dropbar.manifesto.s2.title': 'Clarity',
    'dropbar.manifesto.s2.subtitle': 'Clean structure · no noise',
    'dropbar.manifesto.s3.title': 'Emotion',
    'dropbar.manifesto.s3.subtitle': 'Motion, light, sound',
    'dropbar.manifesto.s4.title': 'Simplicity',
    'dropbar.manifesto.s4.subtitle': 'Minimalism, not emptiness',
    'dropbar.manifesto.featured.title': 'Process',
    'dropbar.manifesto.featured.subtitle': 'Explore · prototype · test · fail · improve',
    'dropbar.lab.s1.title': 'Shader Lab',
    'dropbar.lab.s1.subtitle': 'GLSL & TSL fragments',
    'dropbar.lab.s2.title': 'Audio Reactive',
    'dropbar.lab.s2.subtitle': 'Web Audio → visuals',
    'dropbar.lab.s3.title': 'Generative',
    'dropbar.lab.s3.subtitle': 'Procedural worlds',
    'dropbar.lab.s4.title': 'GPU Particles',
    'dropbar.lab.s4.subtitle': '10k instanced points',
    'dropbar.lab.featured.title': 'Open source',
    'dropbar.lab.featured.subtitle': 'GitHub · experiments + demos',
    'dropbar.contact.s1.title': 'Email',
    'dropbar.contact.s1.subtitle': 'Direct line',
    'dropbar.contact.s2.title': 'Social',
    'dropbar.contact.s2.subtitle': 'Telegram + GitHub',
    'dropbar.contact.s3.title': 'Location',
    'dropbar.contact.s3.subtitle': 'Remote · EU',
    'dropbar.contact.s4.title': 'Form',
    'dropbar.contact.s4.subtitle': 'Tell us about your project',
    'dropbar.contact.featured.title': 'Start a project',
    'dropbar.contact.featured.subtitle': 'Open for new work',

    // Common CTAs
    'common.explore': 'Explore',
    'common.showreel': 'Showreel',
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
    'home.works.lead': 'Selected projects that define our way.',
    'home.works.desc1': 'Selected launches, systems and visual identities.',
    'home.works.desc2': 'Open the case notes.',

    // Home — contact (Manifesto face)
    'home.manifesto.title': 'Manifesto',
    'home.manifesto.lead': 'This is what guides us.',
    'home.manifesto.desc1': 'Clarity before spectacle.',
    'home.manifesto.desc2': 'Every effect must explain a state.',
    'home.manifesto.desc3': 'Every page must earn attention.',

    // Home — Contact
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
    'services.creativeDirection.desc1':
      'We design interfaces that feel like digital products, not websites.',
    'services.creativeDirection.desc2': 'Every interaction has purpose.',
    'services.creativeDirection.desc3': 'Every transition tells a story.',
    'services.interactiveDev.title': 'Realtime build',
    'services.interactiveDev.lead': 'Realtime experiences built with modern web technologies.',
    'services.interactiveDev.desc1': 'Performance comes first.',
    'services.interactiveDev.desc2': 'Motion follows purpose.',
    'services.motionRealtime.title': 'Motion',
    'services.motionRealtime.lead': 'Motion is part of the interface. Not decoration.',
    'services.motionRealtime.desc1': 'Navigation.',
    'services.motionRealtime.desc2': 'Feedback.',
    'services.motionRealtime.desc3': 'Emotion.',
    'services.aiSystems.title': 'AI',
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
    'works.section2.lead': 'Process, craft, result.',
    'works.section3.title': 'Interactive Systems',
    'works.section3.lead': 'Technology shaped into experience.',
    'works.section4.title': 'Recent',
    'works.section4.lead': 'Latest from the studio.',

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

    // Navigation help labels
    'help.title': 'Navigation',
    'help.sections': 'Sections',
    'help.up': 'Up',
    'help.down': 'Down',
    'help.lab': 'Lab',
    'help.menu': 'Menu',
    'help.hint': 'Scroll, swipe or use arrow keys',

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

    // Navigation section (RU)
    'navOverlay.title': 'Навигация',
    'navOverlay.lead': 'Выберите направление.',
    'navOverlay.studio.desc': 'Главная · куб',
    'navOverlay.services.desc': 'Что мы делаем',
    'navOverlay.works.desc': 'Избранные проекты',
    'navOverlay.manifesto.desc': 'Принципы',
    'navOverlay.lab.desc': 'Эксперименты',
    'navOverlay.contact.desc': 'Начать проект',
    'blog.undercurrent.title': 'Undercurrent',
    'blog.glass.title': 'Glassmorphism',
    'blog.rendering.title': 'Рендеринг по требованию',

    // Menu overlay (RU)
    'menu.navigate': 'Навигация',
    'menu.stat.sections': 'LEMONROOM',

    // Cinematic shell + contact finale
    'story.system': 'Кинематографическая web-система · 2026',
    'story.hint': 'Листайте · свайпайте',
    'story.bottomLabel': 'Рабочая заметка',
    'story.contact': 'Связаться',
    'contactFooter.kicker': 'Финальный кадр · открытый канал',
    'contactFooter.title': 'Давайте создадим то, что хочется запомнить.',
    'contactFooter.lead': 'Расскажите, куда должна продолжиться эта история.',
    'contactFooter.telegram': 'TG',

    // Lab section (RU)
    'labOverlay.title': 'Лаб',
    'labOverlay.lead': 'Эксперименты · работы · R&D.',
    'labOverlay.openWorks': 'Открыть работы',

    // Navigation submenu section titles and subtitles.
    // Works page section titles are project names (proper nouns), so they are not translated;
    // so only subtitles get keys for works.
    'dropbar.home.s1.title': 'Студия',
    'dropbar.home.s1.subtitle': 'Удалённо · ЕС · с 2019',
    'dropbar.home.s2.title': 'Услуги',
    'dropbar.home.s2.subtitle': 'От стратегии до реализации',
    'dropbar.home.s3.title': 'Работы',
    'dropbar.home.s3.subtitle': 'Избранные проекты · галерея',
    'dropbar.home.s4.title': 'Манифест',
    'dropbar.home.s4.subtitle': 'Что нами движет',
    'dropbar.home.featured.title': 'Лаборатория',
    'dropbar.home.featured.subtitle': 'Эксперименты · всегда в процессе',
    'dropbar.services.s1.title': 'Креатив',
    'dropbar.services.s1.subtitle': 'Концепция → идентичность',
    'dropbar.services.s2.title': 'Realtime',
    'dropbar.services.s2.subtitle': 'Реальное время · перфоманс',
    'dropbar.services.s3.title': 'Моушн',
    'dropbar.services.s3.subtitle': 'Движение как интерфейс',
    'dropbar.services.s4.title': 'AI',
    'dropbar.services.s4.subtitle': 'Генерация · автоматизация',
    'dropbar.services.featured.title': 'Начать проект',
    'dropbar.services.featured.subtitle': 'Открыты для новых проектов',
    // Works page — project names stay English because they are proper nouns.
    'dropbar.works.s1.subtitle': 'WebGPU симуляция жидкостей',
    'dropbar.works.s2.subtitle': 'Минималистичное портфолио',
    'dropbar.works.s3.subtitle': 'Аудио-реактивное 3D',
    'dropbar.works.s4.subtitle': 'Генеративная типографика',
    'dropbar.works.featured.title': 'Блог',
    'dropbar.works.featured.subtitle': 'Заметки о процессе + кейсы',
    'dropbar.manifesto.s1.title': 'Цель',
    'dropbar.manifesto.s1.subtitle': 'Мы не строим то, что строят все',
    'dropbar.manifesto.s2.title': 'Ясность',
    'dropbar.manifesto.s2.subtitle': 'Чёткая структура · без шума',
    'dropbar.manifesto.s3.title': 'Эмоция',
    'dropbar.manifesto.s3.subtitle': 'Движение, свет, звук',
    'dropbar.manifesto.s4.title': 'Простота',
    'dropbar.manifesto.s4.subtitle': 'Минимализм, а не пустота',
    'dropbar.manifesto.featured.title': 'Процесс',
    'dropbar.manifesto.featured.subtitle': 'Исследовать · прототип · тест · провал · улучшить',
    'dropbar.lab.s1.title': 'Шейдерная лаборатория',
    'dropbar.lab.s1.subtitle': 'GLSL и TSL фрагменты',
    'dropbar.lab.s2.title': 'Аудио-реактивность',
    'dropbar.lab.s2.subtitle': 'Web Audio → визуал',
    'dropbar.lab.s3.title': 'Генеративность',
    'dropbar.lab.s3.subtitle': 'Процедурные миры',
    'dropbar.lab.s4.title': 'GPU-частицы',
    'dropbar.lab.s4.subtitle': '10k инстансированных точек',
    'dropbar.lab.featured.title': 'Open source',
    'dropbar.lab.featured.subtitle': 'GitHub · эксперименты + демо',
    'dropbar.contact.s1.title': 'Почта',
    'dropbar.contact.s1.subtitle': 'Прямая линия',
    'dropbar.contact.s2.title': 'Соцсети',
    'dropbar.contact.s2.subtitle': 'Telegram + GitHub',
    'dropbar.contact.s3.title': 'Локация',
    'dropbar.contact.s3.subtitle': 'Удалённо · ЕС',
    'dropbar.contact.s4.title': 'Форма',
    'dropbar.contact.s4.subtitle': 'Расскажите о своём проекте',
    'dropbar.contact.featured.title': 'Начать проект',
    'dropbar.contact.featured.subtitle': 'Открыты для новых проектов',

    // Common CTAs
    'common.explore': 'Исследовать',
    'common.showreel': 'Шоурил',
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
    'home.works.lead': 'Избранные проекты, определяющие наш подход.',
    'home.works.desc1': 'Запуски, системы и визуальные идентичности.',
    'home.works.desc2': 'Откройте заметки к кейсам.',

    // Home — contact (Manifesto face)
    'home.manifesto.title': 'Манифест',
    'home.manifesto.lead': 'То, что нами движет.',
    'home.manifesto.desc1': 'Ясность важнее зрелищности.',
    'home.manifesto.desc2': 'Каждый эффект объясняет состояние.',
    'home.manifesto.desc3': 'Каждая страница заслуживает внимание.',

    // Home — Contact
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
    'services.creativeDirection.title': 'Креатив',
    'services.creativeDirection.lead': 'От концепции до идентичности.',
    'services.creativeDirection.desc1': 'Интерфейсы как продукты, не сайты.',
    'services.creativeDirection.desc2': 'Каждое действие имеет цель.',
    'services.creativeDirection.desc3': 'Каждый переход — история.',
    'services.interactiveDev.title': 'Realtime',
    'services.interactiveDev.lead': 'Реальное время. Современный веб.',
    'services.interactiveDev.desc1': 'Перфоманс прежде всего.',
    'services.interactiveDev.desc2': 'Движение следует за целью.',
    'services.motionRealtime.title': 'Моушн',
    'services.motionRealtime.lead': 'Движение — часть интерфейса.',
    'services.motionRealtime.desc1': 'Навигация.',
    'services.motionRealtime.desc2': 'Отклик.',
    'services.motionRealtime.desc3': 'Эмоция.',
    'services.aiSystems.title': 'AI',
    'services.aiSystems.lead': 'Креативные процессы на базе AI.',
    'services.aiSystems.desc1': 'Генерация.',
    'services.aiSystems.desc2': 'Автоматизация.',
    'services.aiSystems.desc3': 'Итерация.',
    'services.lab.title': 'Лаб',
    'services.lab.lead': 'Эксперименты. Всегда в процессе.',
    'services.lab.desc1': 'Песочница для шейдеров, звука, R&D.',
    'services.playground.title': 'Плейграунд',
    'services.playground.lead': 'Нечего продавать. Просто игра.',
    'services.playground.desc1': 'Открытые эксперименты, демо, вещи для радости.',

    // Works page — section headers
    'works.section1.title': 'Избранные работы',
    'works.section1.lead': 'Проекты, определяющие наш подход.',
    'works.section2.title': 'Кейсы',
    'works.section2.lead': 'Процесс, ремесло и результаты.',
    'works.section3.title': 'Интерактивные системы',
    'works.section3.lead': 'Технология становится опытом.',
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
    'manifesto.emotion.lead':
      'Мы используем движение, свет и звук, чтобы вызвать чувство присутствия.',
    'manifesto.simplicity.title': 'Простота',
    'manifesto.simplicity.lead': 'Мы стремимся к минимализму — но не к пустоте.',
    'manifesto.process.title': 'Процесс',
    'manifesto.process.lead':
      'Мы исследуем. Мы прототипируем. Мы тестируем. Мы ошибаемся. Мы улучшаем.',
    'manifesto.future.title': 'Будущее',
    'manifesto.future.lead': 'Технологии меняются. Принципы остаются.',

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

    // Navigation help labels
    'help.title': 'Навигация',
    'help.sections': 'Секции',
    'help.up': 'вверх',
    'help.down': 'вниз',
    'help.lab': 'lab',
    'help.menu': 'меню',
    'help.hint': 'используйте джойстик для навигации',

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
