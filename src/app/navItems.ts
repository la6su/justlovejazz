// src/app/navItems.ts — Phase 5: menu destination data shared by the nav
// overlay SFC and its consumers. Ported verbatim from the legacy string
// template (src/sections/nav/template.ts NAV_ITEMS); the template is the
// string-template removal target, this data is the typed SFC source.

export interface NavSubSection {
  num: string
  title: string
  titleKey: string
  href: string
}

export interface NavItemData {
  num: string
  label: string
  labelKey: string
  href: string
  subs: NavSubSection[]
  direct?: boolean
}

export const NAV_ITEMS: NavItemData[] = [
  {
    num: '01',
    label: 'Studio',
    labelKey: 'nav.studio',
    href: '/',
    subs: [
      { num: '01', title: 'Studio', titleKey: 'dropbar.home.s1.title', href: '/#section-intro' },
      { num: '02', title: 'Services', titleKey: 'dropbar.home.s2.title', href: '/#section-about' },
      { num: '03', title: 'Works', titleKey: 'dropbar.home.s3.title', href: '/#section-works' },
      {
        num: '04',
        title: 'Manifesto',
        titleKey: 'dropbar.home.s4.title',
        href: '/#section-contact',
      },
    ],
  },
  {
    num: '02',
    label: 'Services',
    labelKey: 'nav.services',
    href: '/services',
    subs: [
      {
        num: '01',
        title: 'Creative Direction',
        titleKey: 'dropbar.services.s1.title',
        href: '/services#section-services-01',
      },
      {
        num: '02',
        title: 'Realtime build',
        titleKey: 'dropbar.services.s2.title',
        href: '/services#section-services-02',
      },
      {
        num: '03',
        title: 'Motion',
        titleKey: 'dropbar.services.s3.title',
        href: '/services#section-services-03',
      },
      {
        num: '04',
        title: 'AI',
        titleKey: 'dropbar.services.s4.title',
        href: '/services#section-services-04',
      },
    ],
  },
  {
    num: '03',
    label: 'Works',
    labelKey: 'nav.works',
    href: '/works',
    subs: [
      {
        num: '01',
        title: 'Selected Works',
        titleKey: 'works.section1.title',
        href: '/works#section-works-01',
      },
      {
        num: '02',
        title: 'Case Studies',
        titleKey: 'works.section2.title',
        href: '/works#section-works-02',
      },
      {
        num: '03',
        title: 'Interactive Systems',
        titleKey: 'works.section3.title',
        href: '/works#section-works-03',
      },
      {
        num: '04',
        title: 'Recent',
        titleKey: 'works.section4.title',
        href: '/works#section-works-04',
      },
    ],
  },
  {
    num: '04',
    label: 'Manifesto',
    labelKey: 'nav.manifesto',
    href: '/manifesto',
    subs: [
      {
        num: '01',
        title: 'Purpose',
        titleKey: 'dropbar.manifesto.s1.title',
        href: '/manifesto#section-manifesto-01',
      },
      {
        num: '02',
        title: 'Clarity',
        titleKey: 'dropbar.manifesto.s2.title',
        href: '/manifesto#section-manifesto-02',
      },
      {
        num: '03',
        title: 'Emotion',
        titleKey: 'dropbar.manifesto.s3.title',
        href: '/manifesto#section-manifesto-03',
      },
      {
        num: '04',
        title: 'Simplicity',
        titleKey: 'dropbar.manifesto.s4.title',
        href: '/manifesto#section-manifesto-04',
      },
    ],
  },
  {
    num: '05',
    label: 'Lab',
    labelKey: 'nav.lab',
    href: '/lab',
    subs: [
      {
        num: '01',
        title: 'Shader Lab',
        titleKey: 'lab.shaderLab.title',
        href: '/lab#section-lab-01',
      },
      {
        num: '02',
        title: 'Audio Reactive',
        titleKey: 'lab.audioReactive.title',
        href: '/lab#section-lab-02',
      },
      {
        num: '03',
        title: 'Generative',
        titleKey: 'lab.generative.title',
        href: '/lab#section-lab-03',
      },
      {
        num: '04',
        title: 'GPU Particles',
        titleKey: 'lab.gpuParticles.title',
        href: '/lab#section-lab-04',
      },
    ],
  },
  {
    num: '06',
    label: 'Blog',
    labelKey: 'nav.blog',
    href: '/blog',
    direct: true,
    subs: [
      { num: '01', title: 'Journal', titleKey: 'nav.blog', href: '/blog' },
      {
        num: '02',
        title: 'Undercurrent',
        titleKey: 'blog.undercurrent.title',
        href: '/blog/undercurrent-webgpu-fluid',
      },
      {
        num: '03',
        title: 'Glassmorphism',
        titleKey: 'blog.glass.title',
        href: '/blog/glassmorphism-webgpu',
      },
      {
        num: '04',
        title: 'On-demand Rendering',
        titleKey: 'blog.rendering.title',
        href: '/blog/on-demand-rendering',
      },
    ],
  },
  {
    num: '07',
    label: 'Contact',
    labelKey: 'nav.contact',
    href: '/contact',
    subs: [
      {
        num: '01',
        title: 'Email',
        titleKey: 'dropbar.contact.s1.title',
        href: '/contact#section-contact-01',
      },
      {
        num: '02',
        title: 'Social',
        titleKey: 'dropbar.contact.s2.title',
        href: '/contact#section-contact-02',
      },
      {
        num: '03',
        title: 'Location',
        titleKey: 'dropbar.contact.s3.title',
        href: '/contact#section-contact-03',
      },
      {
        num: '04',
        title: 'Form',
        titleKey: 'dropbar.contact.s4.title',
        href: '/contact#section-contact-04',
      },
    ],
  },
]
