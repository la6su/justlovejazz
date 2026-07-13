// src/sections/nav/template.ts — Menu overlay (secret right section on all pages)
//
// UNIQUE template — does NOT use sectionShell(). VOSK-inspired 3-column grid.
//
// Layout:
//   ┌──────────────────────────────────────────────┐
//   │ [theme] [sound]            JUSTLOVEJAZZ      │  top bar
//   ├──────────────────────────────────────────────┤
//   │  STAT          NAVIGATE          CONTACT     │  3-column grid
//   │  06            01 Studio ▸       hello@      │
//   │  SECTIONS      02 Services ▸    Telegram    │
//   │  EST 2019      03 Works ▸        GitHub      │
//   │                04 Manifesto ▸                │
//   │                05 Lab ▸                      │
//   │                06 Contact ▸                  │
//   ├──────────────────────────────────────────────┤
//   │ © 2026 · WEBGPU · TSL · UIKIT                │  footer
//   └──────────────────────────────────────────────┘
//
// Nav item click behavior:
//   - Desktop (≥640px): dropdown panel appears to the RIGHT of nav list,
//     showing subsections. Click subsection → navigate to that section.
//   - Mobile (<640px): accordion unfold — subsections appear INLINE below
//     the nav item. Click subsection → navigate.
//   - Only ONE nav item expanded at a time (clicking another closes the first).
//
// Visibility:
//   - Hidden by default (section[data-section] { display: none }).
//   - Shown when .section-active is added (joystick right / hamburger click).
//   - backdrop-filter: blur(20px) on overlay for glass-morphism separation
//     from the 3D canvas behind.
//
// Exit (close menu):
//   - Hamburger X click → jlz:close-nav → return to previous main section.
//   - Joystick arrow left → same behavior.
//   - Subsection click → navigate to target section (menu auto-closes).

import { themeManager } from '../../core/ThemeManager'
import { getLang } from '../../core/i18n'

// ── Navigation items with subsections ──
interface SubSection {
  num: string
  title: string
  titleKey: string
  href: string
}

interface NavItem {
  num: string
  label: string
  labelKey: string
  href: string
  subs: SubSection[]
}

const NAV_ITEMS: NavItem[] = [
  {
    num: '01', label: 'Studio', labelKey: 'nav.studio', href: '/',
    subs: [
      { num: '01', title: 'Studio', titleKey: 'dropbar.home.s1.title', href: '/#section-intro' },
      { num: '02', title: 'Services', titleKey: 'dropbar.home.s2.title', href: '/#section-about' },
      { num: '03', title: 'Works', titleKey: 'dropbar.home.s3.title', href: '/#section-works' },
      { num: '04', title: 'Manifesto', titleKey: 'dropbar.home.s4.title', href: '/#section-contact' },
    ],
  },
  {
    num: '02', label: 'Services', labelKey: 'nav.services', href: '/services',
    subs: [
      { num: '01', title: 'Creative Direction', titleKey: 'dropbar.services.s1.title', href: '/services#section-services-01' },
      { num: '02', title: 'Interactive Development', titleKey: 'dropbar.services.s2.title', href: '/services#section-services-02' },
      { num: '03', title: 'Motion & Realtime', titleKey: 'dropbar.services.s3.title', href: '/services#section-services-03' },
      { num: '04', title: 'AI Systems', titleKey: 'dropbar.services.s4.title', href: '/services#section-services-04' },
    ],
  },
  {
    num: '03', label: 'Works', labelKey: 'nav.works', href: '/works',
    subs: [
      { num: '01', title: 'Selected Works', titleKey: 'works.section1.title', href: '/works#section-works-01' },
      { num: '02', title: 'Case Studies', titleKey: 'works.section2.title', href: '/works#section-works-02' },
      { num: '03', title: 'Experiments', titleKey: 'works.section3.title', href: '/works#section-works-03' },
      { num: '04', title: 'Recent', titleKey: 'works.section4.title', href: '/works#section-works-04' },
    ],
  },
  {
    num: '04', label: 'Manifesto', labelKey: 'nav.manifesto', href: '/manifesto',
    subs: [
      { num: '01', title: 'Purpose', titleKey: 'dropbar.manifesto.s1.title', href: '/manifesto#section-manifesto-01' },
      { num: '02', title: 'Clarity', titleKey: 'dropbar.manifesto.s2.title', href: '/manifesto#section-manifesto-02' },
      { num: '03', title: 'Emotion', titleKey: 'dropbar.manifesto.s3.title', href: '/manifesto#section-manifesto-03' },
      { num: '04', title: 'Simplicity', titleKey: 'dropbar.manifesto.s4.title', href: '/manifesto#section-manifesto-04' },
    ],
  },
  {
    num: '05', label: 'Lab', labelKey: 'nav.lab', href: '/lab',
    subs: [
      { num: '01', title: 'Shader Lab', titleKey: 'dropbar.lab.s1.title', href: '/lab#section-lab-01' },
      { num: '02', title: 'Audio Reactive', titleKey: 'dropbar.lab.s2.title', href: '/lab#section-lab-02' },
      { num: '03', title: 'Generative', titleKey: 'dropbar.lab.s3.title', href: '/lab#section-lab-03' },
      { num: '04', title: 'GPU Particles', titleKey: 'dropbar.lab.s4.title', href: '/lab#section-lab-04' },
    ],
  },
  {
    num: '06', label: 'Contact', labelKey: 'nav.contact', href: '/contact',
    subs: [
      { num: '01', title: 'Email', titleKey: 'dropbar.contact.s1.title', href: '/contact#section-contact-01' },
      { num: '02', title: 'Social', titleKey: 'dropbar.contact.s2.title', href: '/contact#section-contact-02' },
      { num: '03', title: 'Location', titleKey: 'dropbar.contact.s3.title', href: '/contact#section-contact-03' },
      { num: '04', title: 'Form', titleKey: 'dropbar.contact.s4.title', href: '/contact#section-contact-04' },
    ],
  },
]

// ── Inline SVG icons (UIKit3 has no sun/moon — see docs/UIKIT3.md §7.13) ──
const SUN_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" class="jlz-theme-svg jlz-theme-svg--sun"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zm9-9a1 1 0 0 1-1 1h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zM6 12a1 1 0 0 1-1 1H3a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zm13.07-6.07a1 1 0 0 1 0 1.41l-1.42 1.42a1 1 0 1 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0zM7.76 16.24a1 1 0 0 1 0 1.41l-1.42 1.42a1 1 0 0 1-1.41-1.41l1.42-1.42a1 1 0 0 1 1.41 0zm10.48 0a1 1 0 0 1 1.42 1.41l-1.42 1.42a1 1 0 0 1-1.41-1.41l1.41-1.42zM7.76 7.76a1 1 0 0 1-1.41 0L4.93 6.34a1 1 0 0 1 1.41-1.41l1.42 1.42a1 1 0 0 1 0 1.41z"/></svg>`
const MOON_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" class="jlz-theme-svg jlz-theme-svg--moon"><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.4 5.4 0 0 1-7.54-7.54C12.92 3.04 12.46 3 12 3z"/></svg>`

// ── Config toolbar (theme toggle + sound toggle) ──
function configToolbar(): string {
  return `
    <div class="jlz-menu-toolbar uk-flex uk-flex-middle" role="toolbar" aria-label="Settings">
      <button class="uk-icon-button jlz-theme-toggle" type="button" id="jlz-theme-toggle"
              aria-label="Toggle inverse theme" aria-pressed="false" title="Theme: auto"
              uk-tooltip="pos: bottom; delay: 200">
        ${SUN_SVG}${MOON_SVG}
      </button>
      <button class="uk-icon-button jlz-sound-toggle" type="button" id="jlz-menu-sound"
              aria-label="Toggle sound" aria-pressed="true" title="Sound: off"
              uk-tooltip="pos: bottom; delay: 200">
        <span class="jlz-sound-bars" aria-hidden="true">
          <span class="jlz-sound-bar"></span>
          <span class="jlz-sound-bar"></span>
          <span class="jlz-sound-bar"></span>
          <span class="jlz-sound-bar"></span>
        </span>
      </button>
    </div>
  `
}

// ── Left column: stat / studio identity ──
function statColumn(): string {
  return `
    <div class="jlz-menu-col jlz-menu-col--stat">
      <div class="jlz-menu-stat">
        <span class="jlz-menu-stat__num">06</span>
        <span class="jlz-menu-stat__label" data-i18n="menu.stat.sections">SECTIONS</span>
      </div>
      <div class="jlz-menu-stat-meta">
        <span class="jlz-menu-eyebrow">EST 2019</span>
        <span class="jlz-menu-eyebrow">REMOTE · EU</span>
      </div>
    </div>
  `
}

// ── Center column: nav list with subsections ──
function navColumn(): string {
  const items = NAV_ITEMS.map((item) => `
    <li class="jlz-menu-nav__item" data-nav-item="${item.num}">
      <button class="jlz-menu-nav__toggle" type="button" aria-expanded="false" data-magnetic>
        <span class="jlz-menu-nav__num">${item.num}</span>
        <span class="jlz-menu-nav__label" data-i18n="${item.labelKey}">${item.label}</span>
        <span class="jlz-menu-nav__arrow" aria-hidden="true">▸</span>
      </button>
      <ul class="jlz-menu-nav__subs">
        ${item.subs.map(sub => `
          <li class="jlz-menu-nav__sub-item">
            <a href="${sub.href}" class="jlz-menu-nav__sub-link" data-magnetic data-nav-href="${sub.href}">
              <span class="jlz-menu-nav__sub-num">${sub.num}</span>
              <span class="jlz-menu-nav__sub-title" data-i18n="${sub.titleKey}">${sub.title}</span>
              <span class="jlz-menu-nav__sub-arrow" aria-hidden="true">→</span>
            </a>
          </li>
        `).join('')}
      </ul>
    </li>
  `).join('')
  return `
    <div class="jlz-menu-col jlz-menu-col--nav">
      <span class="jlz-menu-col-title" data-i18n="menu.navigate">NAVIGATE</span>
      <ul class="jlz-menu-nav">${items}</ul>
    </div>
  `
}

// ── Right column: contacts + socials ──
function contactsColumn(): string {
  return `
    <div class="jlz-menu-col jlz-menu-col--contact">
      <span class="jlz-menu-col-title" data-i18n="menu.contact">CONTACT</span>
      <ul class="jlz-menu-contact-list">
        <li><a href="mailto:hello@justlovejazz.com" class="jlz-menu-contact-link" data-magnetic>
          <span data-i18n="common.email">Email</span>
        </a></li>
        <li><a href="https://t.me/justlovejazz" target="_blank" rel="noopener" class="jlz-menu-contact-link" data-magnetic>
          <span data-i18n="common.telegram">Telegram</span>
        </a></li>
        <li><a href="https://github.com/la6su" target="_blank" rel="noopener" class="jlz-menu-contact-link" data-magnetic>
          <span data-i18n="common.github">GitHub</span>
        </a></li>
      </ul>
      <span class="jlz-menu-col-title jlz-menu-col-title--follow" data-i18n="menu.follow">FOLLOW</span>
      <ul class="jlz-menu-contact-list">
        <li><a href="https://x.com/justlovejazz" target="_blank" rel="noopener" class="jlz-menu-contact-link" data-magnetic>X</a></li>
        <li><a href="https://www.instagram.com/justlovejazz" target="_blank" rel="noopener" class="jlz-menu-contact-link" data-magnetic>Instagram</a></li>
      </ul>
    </div>
  `
}

// ── Footer ──
function menuFooter(): string {
  return `
    <footer class="jlz-menu-footer">
      <span class="jlz-menu-footer__text">© 2026 JUSTLOVEJAZZ</span>
      <span class="jlz-menu-footer__sep" aria-hidden="true">·</span>
      <span class="jlz-menu-footer__text">WEBGPU · TSL · UIKIT</span>
    </footer>
  `
}

/**
 * Menu overlay section — UNIQUE template (not sectionShell).
 *
 * Visibility: hidden by default (section[data-section] { display: none }).
 * Shown when .section-active is added by JoystickNav / ContentReveal.
 *
 * @param mode 'home' = data-section (3D cube face sync) | 'content' = data-page-section
 */
export function navOverlaySection(mode: 'home' | 'content' = 'content'): string {
  const sectionAttr = mode === 'home' ? 'data-section="menu"' : 'data-page-section="page-menu"'
  return `
    <section class="jlz-menu-overlay uk-section uk-section-xsmall" id="section-menu" ${sectionAttr}>
      <div class="uk-container uk-container-expand jlz-menu-container">
        <!-- Top bar: config toolbar + brand -->
        <div class="jlz-menu-topbar">
          ${configToolbar()}
          <span class="jlz-menu-brand">JUSTLOVEJAZZ</span>
        </div>
        <!-- Main 3-column grid -->
        <div class="jlz-menu-grid">
          ${statColumn()}
          ${navColumn()}
          ${contactsColumn()}
        </div>
        <!-- Footer -->
        ${menuFooter()}
      </div>
    </section>
  `
}

// ── Nav item toggle (desktop dropdown / mobile accordion) ──

/**
 * Initialize nav item click handlers.
 * Called by router.ts after every renderView().
 *
 * Behavior:
 *   - Click nav item toggle → expand/collapse subsections.
 *   - Only ONE item expanded at a time (clicking another closes the first).
 *   - Subsection click → navigate via SPA router (intercepted, no full reload).
 *   - After subsection navigation → auto-close menu (dispatch jlz:close-nav).
 */
export function initMenuNav(): void {
  const nav = document.querySelector('.jlz-menu-nav')
  if (!nav) return

  // Nav item toggles
  const toggles = nav.querySelectorAll<HTMLButtonElement>('.jlz-menu-nav__toggle')
  toggles.forEach((toggle) => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault()
      const item = toggle.closest('.jlz-menu-nav__item')
      if (!item) return
      const isExpanded = item.classList.contains('is-expanded')

      // Close all other items (only one open at a time)
      nav.querySelectorAll('.jlz-menu-nav__item.is-expanded').forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-expanded')
          other.querySelector<HTMLButtonElement>('.jlz-menu-nav__toggle')?.setAttribute('aria-expanded', 'false')
        }
      })

      // Toggle current item
      item.classList.toggle('is-expanded', !isExpanded)
      toggle.setAttribute('aria-expanded', String(!isExpanded))
    })
  })

  // Subsection links — intercept for SPA navigation + auto-close menu
  const subLinks = nav.querySelectorAll<HTMLAnchorElement>('.jlz-menu-nav__sub-link')
  subLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('data-nav-href') || link.getAttribute('href') || ''
      if (!href) return

      // Parse path + hash (e.g. "/services#section-services-02")
      const url = new URL(href, window.location.origin)
      if (url.origin !== window.location.origin) return // external link, let it pass

      e.preventDefault()

      // Navigate via SPA router (pushState + renderView)
      const path = url.pathname
      const hash = url.hash

      // Dispatch close-nav FIRST (returns to previous main section, which
      // closes the menu overlay). Then navigate.
      window.dispatchEvent(new CustomEvent('jlz:close-nav'))

      // Small delay so menu-close animation starts before route change
      setTimeout(() => {
        if (path !== window.location.pathname) {
          // Navigate to a different page — use history + route-change
          history.pushState(null, '', path)
          window.dispatchEvent(new CustomEvent('jlz:route-change', { detail: { page: path } }))
        }
        // If hash present, scroll to section after route renders
        if (hash) {
          setTimeout(() => {
            const target = document.querySelector(hash)
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 150)
        }
      }, 100)
    })
  })
}

// ── Theme + sound toggle wiring ──

const SOUND_STORAGE_KEY = 'jlz:sound'

function readSoundMuted(): boolean {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'on'
  } catch {
    return true
  }
}

function writeSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, muted ? 'off' : 'on')
  } catch { /* localStorage unavailable */ }
}

function syncThemeButton(btn: HTMLButtonElement): void {
  const isInverse = themeManager.isInverse
  btn.setAttribute('aria-pressed', String(isInverse))
  btn.title = isInverse ? 'Theme: inverse' : 'Theme: auto'
  btn.classList.toggle('is-inverse', isInverse)
}

function syncSoundButton(btn: HTMLButtonElement, muted: boolean): void {
  btn.setAttribute('aria-pressed', String(!muted))
  btn.title = muted ? 'Sound: off' : 'Sound: on'
  btn.classList.toggle('is-muted', muted)
  btn.classList.toggle('is-playing', !muted)
  btn.querySelectorAll<HTMLElement>('.jlz-sound-bar').forEach((bar) => {
    bar.style.animationPlayState = muted ? 'paused' : 'running'
  })
}

let _soundMuted = readSoundMuted()

/**
 * Initialize the menu-overlay config toolbar + nav items.
 * Called by router.ts after every renderView() (DOM is fresh each time).
 */
export function initMenuToolbar(): void {
  const themeBtn = document.getElementById('jlz-theme-toggle') as HTMLButtonElement | null
  const soundBtn = document.getElementById('jlz-menu-sound') as HTMLButtonElement | null

  if (themeBtn) {
    syncThemeButton(themeBtn)
    themeBtn.addEventListener('click', () => {
      themeManager.toggle()
    })
  }

  if (soundBtn) {
    syncSoundButton(soundBtn, _soundMuted)
    soundBtn.addEventListener('click', () => {
      _soundMuted = !_soundMuted
      writeSoundMuted(_soundMuted)
      syncSoundButton(soundBtn, _soundMuted)
      window.dispatchEvent(new CustomEvent('jlz:sound-toggle', {
        detail: { muted: _soundMuted },
      }))
    })
  }

  // Initialize nav item toggle handlers (desktop dropdown / mobile accordion)
  initMenuNav()
}

/**
 * Wire global listeners ONCE (not per renderView). Called by main-app.ts
 * after UIManager.init().
 */
let _wired = false
export function wireMenuToolbarGlobals(): void {
  if (_wired) return
  _wired = true
  window.addEventListener('jlz:theme-change', () => {
    const btn = document.getElementById('jlz-theme-toggle') as HTMLButtonElement | null
    if (btn) syncThemeButton(btn)
  })
  window.addEventListener('jlz:sound-toggle', (e: Event) => {
    const detail = (e as CustomEvent<{ muted: boolean }>).detail
    if (detail) {
      _soundMuted = detail.muted
      writeSoundMuted(_soundMuted)
      const btn = document.getElementById('jlz-menu-sound') as HTMLButtonElement | null
      if (btn) syncSoundButton(btn, _soundMuted)
    }
  })
  window.addEventListener('jlz:lang-change', () => {
    void getLang()
    const tBtn = document.getElementById('jlz-theme-toggle') as HTMLButtonElement | null
    const sBtn = document.getElementById('jlz-menu-sound') as HTMLButtonElement | null
    if (tBtn) syncThemeButton(tBtn)
    if (sBtn) syncSoundButton(sBtn, _soundMuted)
  })
}
