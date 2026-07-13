// src/sections/nav/template.ts — Menu overlay (secret right section on all pages)
//
// UNIQUE template — does NOT use sectionShell(). VOSK-inspired 3-column grid:
//   ┌──────────────────────────────────────────────┐
//   │ [theme] [sound]            JUSTLOVEJAZZ      │  top bar
//   ├──────────────────────────────────────────────┤
//   │  STAT          NAVIGATE          CONTACT     │  3-column grid
//   │  06            01 Studio         hello@      │
//   │  SECTIONS      02 Services       Telegram    │
//   │  EST 2019      03 Works          GitHub      │
//   │                04 Manifesto                  │
//   │                05 Lab                       │
//   │                06 Contact                   │
//   ├──────────────────────────────────────────────┤
//   │ © 2026 · WEBGPU · TSL · UIKIT                │  footer
//   └──────────────────────────────────────────────┘
//
// Responsive:
//   - Desktop (≥640px): 3-column grid, all content visible in 1 screen.
//   - Mobile (<640px): single column, stacked (stat → nav → contacts),
//     still fits 1 screen via clamp() font sizing.
//
// The menu overlay is section 5 (joystick right) on home, page-menu on
// content pages. Config toolbar (theme toggle sun/moon + sound toggle EQ)
// lives in the top bar — NOT in the header.

import { themeManager } from '../../core/ThemeManager'
import { getLang } from '../../core/i18n'

// ── Navigation items (flat list — no accordion, VOSK-style) ──
interface NavItem {
  num: string
  label: string
  labelKey: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { num: '01', label: 'Studio', labelKey: 'nav.studio', href: '/' },
  { num: '02', label: 'Services', labelKey: 'nav.services', href: '/services' },
  { num: '03', label: 'Works', labelKey: 'nav.works', href: '/works' },
  { num: '04', label: 'Manifesto', labelKey: 'nav.manifesto', href: '/manifesto' },
  { num: '05', label: 'Lab', labelKey: 'nav.lab', href: '/lab' },
  { num: '06', label: 'Contact', labelKey: 'nav.contact', href: '/contact' },
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

// ── Center column: main navigation list ──
function navColumn(): string {
  const items = NAV_ITEMS.map((item) => `
    <li class="jlz-menu-nav__item">
      <a href="${item.href}" class="jlz-menu-nav__link" data-magnetic>
        <span class="jlz-menu-nav__num">${item.num}</span>
        <span class="jlz-menu-nav__label" data-i18n="${item.labelKey}">${item.label}</span>
        <span class="jlz-menu-nav__arrow" aria-hidden="true">→</span>
      </a>
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
 * Layout: fullscreen 3-column grid, fits in 1 screen (100dvh, no scroll).
 *   - Top bar: config toolbar (left) + logo/brand (right)
 *   - Main: 3-column grid (stat | nav | contacts)
 *   - Footer: copyright + tech stack
 *
 * Responsive:
 *   - Desktop (≥640px): 3-column grid.
 *   - Mobile (<640px): single column, stacked (stat → nav → contacts).
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
 * Initialize the menu-overlay config toolbar.
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
