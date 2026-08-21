// src/__tests__/appSfcParity.test.ts — Phase 5: semantic route SFC ↔
// legacy string-template DOM parity.
//
// The route SFCs (src/app/views/*) are 1:1 ports of the string templates
// (src/pages/*): the scene runtime, the CSS hooks and the 3D navigation
// owner all read the same section ids/attributes, so any drift is a
// regression. The fingerprint compares the parsed DOM of every `<section>`
// (class attributes and whitespace-only text removed — the SFCs are the
// living port, the templates the deletion target of the Phase 5 cleanup).

import { describe, expect, it, vi } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'

vi.mock('uikit', () => ({
  default: { update: vi.fn() },
}))

import HomeView from '../app/views/HomeView.vue'
import ContactView from '../app/views/ContactView.vue'
import LabView from '../app/views/LabView.vue'
import ManifestoView from '../app/views/ManifestoView.vue'
import ServicesView from '../app/views/ServicesView.vue'
import WorksView from '../app/views/WorksView.vue'
import { homePage } from '../pages/home'
import { contactPage } from '../pages/content/contact'
import { labPage } from '../pages/content/lab'
import { manifestoPage } from '../pages/content/manifesto'
import { servicesPage } from '../pages/content/services'
import { worksPage } from '../pages/content/works'

/** Parsed-DOM fingerprint of every <section>: structure + non-class
 *  attributes + text, class attributes and whitespace dropped. */
function fingerprint(html: string): string {
  const scratch = document.createElement('div')
  scratch.innerHTML = html
  // Drop comments (SSR v-for markers) and normalize text nodes: trim, and
  // remove whitespace-only nodes (template indentation vs SSR condense).
  const walker = document.createTreeWalker(scratch, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT)
  const removable: Node[] = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (node.nodeType === Node.COMMENT_NODE) {
      removable.push(node)
      continue
    }
    const text = node.textContent ?? ''
    if (!text.trim()) removable.push(node)
    else node.textContent = text.trim()
  }
  for (const node of removable) node.parentNode?.removeChild(node)
  return Array.from(scratch.querySelectorAll('section'))
    .map((s) => s.outerHTML.replace(/\s+class="[^"]*"/g, ''))
    .join('\n###\n')
}

const expectParity = async (view: object, renderPage: () => string): Promise<void> => {
  const sfcHtml = await renderToString(createSSRApp(view))
  expect(fingerprint(sfcHtml)).toBe(fingerprint(renderPage()))
}

describe('route SFC ↔ string-template parity', () => {
  it('home (6 cube-face sections)', () => expectParity(HomeView, homePage))
  it('services (4 story beats + overlays)', () => expectParity(ServicesView, servicesPage))
  it('works (4 editorial compositions + overlays)', () => expectParity(WorksView, worksPage))
  it('manifesto (4 principles + overlays)', () => expectParity(ManifestoView, manifestoPage))
  it('lab (4 experiments + overlays)', () => expectParity(LabView, labPage))
  it('contact (4 panels + overlays)', () => expectParity(ContactView, contactPage))
})
