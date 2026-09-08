// Top-level destinations rendered by NavMenu.vue.
export interface NavItemData {
  num: string
  label: string
  labelKey: string
  href: string
}

export const NAV_ITEMS: readonly NavItemData[] = [
  { num: '01', label: 'Studio', labelKey: 'nav.studio', href: '/' },
  { num: '02', label: 'Services', labelKey: 'nav.services', href: '/services' },
  { num: '03', label: 'Works', labelKey: 'nav.works', href: '/works' },
  { num: '04', label: 'Manifesto', labelKey: 'nav.manifesto', href: '/manifesto' },
  { num: '05', label: 'Lab', labelKey: 'nav.lab', href: '/lab' },
  { num: '06', label: 'Blog', labelKey: 'nav.blog', href: '/blog' },
  { num: '07', label: 'Contact', labelKey: 'nav.contact', href: '/contact' },
]

/** Stable route anchors retained for direct links and covered by the route test. */
export const NAV_SECTION_LINKS = [
  '/#section-intro',
  '/#section-about',
  '/#section-works',
  '/#section-contact',
  '/services#section-services-creativeDirection',
  '/services#section-services-interactiveDev',
  '/services#section-services-motionRealtime',
  '/services#section-services-aiSystems',
  '/works#section-works-01',
  '/works#section-works-02',
  '/works#section-works-03',
  '/works#section-works-04',
  '/manifesto#section-manifesto-purpose',
  '/manifesto#section-manifesto-clarity',
  '/manifesto#section-manifesto-emotion',
  '/manifesto#section-manifesto-simplicity',
  '/lab#section-lab-01',
  '/lab#section-lab-02',
  '/lab#section-lab-03',
  '/lab#section-lab-04',
  '/contact#section-contact-01',
  '/contact#section-contact-02',
  '/contact#section-contact-03',
  '/contact#section-contact-04',
] as const
