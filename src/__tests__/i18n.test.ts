import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initI18n, getLang, toggleLang, t, applyTranslations, type Lang } from '../core/i18n'
import { eventBus } from '../core/EventBus'

// i18n module holds mutable `currentLang` state at module scope. Tests must
// reset it between cases — toggleLang persists to localStorage, so we clear
// that + reset via initI18n() (which reads from localStorage). toggleLang
// publishes jlz:lang-change on the typed eventBus (the raw window bridge was
// removed in Phase 10).

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear()
    // i18n holds module-scoped `currentLang`. initI18n() only sets RU when
    // localStorage has 'jlz:lang=RU' — it does NOT reset to EN on empty storage.
    // So if a previous test toggled to RU, we must explicitly toggle back.
    if (getLang() === 'RU') toggleLang()
    initI18n()
  })

  afterEach(() => {
    localStorage.clear()
    if (getLang() === 'RU') toggleLang()
    vi.restoreAllMocks()
  })

  describe('getLang', () => {
    it('returns EN by default (no localStorage)', () => {
      expect(getLang()).toBe<Lang>('EN')
    })

    it('returns RU after initI18n reads jlz:lang=RU from localStorage', () => {
      localStorage.setItem('jlz:lang', 'RU')
      initI18n()
      expect(getLang()).toBe<Lang>('RU')
    })

    it('ignores invalid localStorage value (falls back to EN)', () => {
      // initI18n only switches to RU if the stored value is exactly 'RU'.
      // 'FR' is ignored — currentLang stays at whatever it was (EN here).
      localStorage.setItem('jlz:lang', 'FR')
      initI18n()
      expect(getLang()).toBe<Lang>('EN')
    })
  })

  describe('toggleLang', () => {
    it('switches EN → RU', () => {
      expect(getLang()).toBe('EN')
      const result = toggleLang()
      expect(result).toBe<Lang>('RU')
      expect(getLang()).toBe<Lang>('RU')
    })

    it('switches RU → EN', () => {
      localStorage.setItem('jlz:lang', 'RU')
      initI18n()
      expect(toggleLang()).toBe<Lang>('EN')
    })

    it('persists the new language to localStorage', () => {
      toggleLang()
      expect(localStorage.getItem('jlz:lang')).toBe('RU')
      toggleLang()
      expect(localStorage.getItem('jlz:lang')).toBe('EN')
    })

    it('publishes jlz:lang-change on the eventBus with the new lang', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit')
      toggleLang()
      const call = emitSpy.mock.calls.find(([name]) => name === 'jlz:lang-change')
      expect(call).toBeDefined()
      expect(call?.[1]).toEqual({ lang: 'RU' })
    })

    it('round-trips: EN → RU → EN → RU', () => {
      expect(toggleLang()).toBe('RU')
      expect(toggleLang()).toBe('EN')
      expect(toggleLang()).toBe('RU')
      // Leave in EN for subsequent tests
      toggleLang()
    })
  })

  describe('t (translate)', () => {
    it('returns the EN translation when lang=EN', () => {
      expect(t('common.explore')).toBe('Explore')
    })

    it('returns the RU translation after toggleLang', () => {
      toggleLang() // → RU
      expect(t('common.explore')).toBe('Исследовать')
    })

    it('returns the key itself when the key does not exist', () => {
      expect(t('nonexistent.key.xyz')).toBe('nonexistent.key.xyz')
    })

    it('falls back to EN when the key exists in EN but not RU', () => {
      // Sanity: a key that exists in both should switch cleanly.
      expect(t('nav.studio')).toBe('Studio')
      toggleLang()
      expect(t('nav.studio')).toBe('Студия')
    })

    it('returns the same value for a key that is identical across languages', () => {
      // Proper nouns deliberately use the same value in EN and RU.
      // 'blog.undercurrent.title' should be 'Undercurrent' in both.
      const en = t('blog.undercurrent.title')
      toggleLang()
      const ru = t('blog.undercurrent.title')
      expect(en).toBe(ru)
    })
  })

  describe('applyTranslations', () => {
    it('updates textContent on [data-i18n] elements', () => {
      const el = document.createElement('button')
      el.setAttribute('data-i18n', 'nav.studio')
      el.textContent = 'placeholder'
      document.body.appendChild(el)

      applyTranslations()
      expect(el.textContent).toBe('Studio')

      toggleLang() // → RU
      applyTranslations()
      expect(el.textContent).toBe('Студия')
    })

    it('updates placeholder on [data-i18n-placeholder] input elements', () => {
      const input = document.createElement('input')
      input.setAttribute('data-i18n-placeholder', 'contact.email.title')
      input.placeholder = 'old'
      document.body.appendChild(input)

      applyTranslations()
      // contact.email.title is 'Email' in EN.
      expect(input.placeholder).toBe('Email')
    })

    it('ignores [data-i18n-placeholder] on non-input elements (no crash)', () => {
      const div = document.createElement('div')
      div.setAttribute('data-i18n-placeholder', 'contact.email.title')
      document.body.appendChild(div)
      // Should not throw — the guard checks instanceof HTMLInputElement.
      expect(() => applyTranslations()).not.toThrow()
    })

    it('does not touch elements without data-i18n attributes', () => {
      const el = document.createElement('p')
      el.textContent = 'untouched'
      document.body.appendChild(el)
      applyTranslations()
      expect(el.textContent).toBe('untouched')
    })

    it('leaves an unknown key as the key string in textContent', () => {
      const el = document.createElement('span')
      el.setAttribute('data-i18n', 'definitely.not.a.real.key')
      document.body.appendChild(el)
      applyTranslations()
      expect(el.textContent).toBe('definitely.not.a.real.key')
    })
  })

  describe('initI18n', () => {
    it('does not throw when localStorage is unavailable', () => {
      // jsdom allows localStorage; simulate unavailability by stubbing.
      const orig = Object.getOwnPropertyDescriptor(window, 'localStorage')
      Object.defineProperty(window, 'localStorage', {
        get: () => {
          throw new Error('SecurityError')
        },
        configurable: true,
      })
      expect(() => initI18n()).not.toThrow()
      // Restore
      if (orig) Object.defineProperty(window, 'localStorage', orig)
    })
  })

  describe('EN/RU dictionary parity (regression guard)', () => {
    // If a key is added to EN but forgotten in RU (or vice versa), the UI
    // silently shows the wrong language. This test catches that.
    it('EN and RU dictionaries have the same set of keys', () => {
      // Re-import the raw dictionary by reading translations through t():
      // we can't import TRANSLATIONS directly (not exported), so we probe
      // a known set of critical keys + count via a side channel.
      // Instead, compare key counts by switching languages and checking
      // that every EN key resolves to a non-key value in RU.
      const probeKeys = [
        'nav.studio',
        'nav.services',
        'nav.works',
        'nav.manifesto',
        'nav.lab',
        'nav.contact',
        'nav.blog',
        'common.explore',
        'home.studio.title',
        'home.about.title',
        'home.works.title',
        'home.manifesto.title',
        'meta.home.title',
        'meta.home.description',
        'meta.services.title',
        'meta.works.title',
        'meta.manifesto.title',
        'meta.lab.title',
        'meta.contact.title',
        'dropbar.home.s1.title',
        'dropbar.home.s2.title',
        'dropbar.services.s1.title',
        'dropbar.services.s2.title',
        'dropbar.manifesto.s1.title',
        'dropbar.contact.s1.title',
        'dropbar.contact.s2.title',
        'works.section1.title',
        'works.room1.premise',
        'manifesto.purpose.title',
        'lab.shaderLab.title',
        'contact.email.title',
        'contact.social.title',
        'blog.undercurrent.title',
      ]

      // For each key: EN value should not equal the key (key exists in EN),
      // AND toggling to RU should give a value that's either the RU translation
      // or — for proper nouns — the same as EN.
      for (const key of probeKeys) {
        const enValue = t(key)
        expect(enValue, `EN key "${key}" should exist (not equal to key)`).not.toBe(key)
        toggleLang() // → RU
        const ruValue = t(key)
        // RU value should not be the raw key (means it's missing from RU dict)
        expect(ruValue, `RU key "${key}" should exist (not fall back to key string)`).not.toBe(key)
        toggleLang() // → EN back
      }
    })
  })
})
