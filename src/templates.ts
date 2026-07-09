// src/templates.ts — Backward-compat shim.
//
// All page templates have been reorganized into src/pages/:
//   src/pages/index.ts           — renderPage() + PageId
//   src/pages/home.ts            — homePage()
//   src/pages/sections/*.ts      — 6 home section templates (1:1 cube faces)
//   src/pages/content/*.ts       — 6 content page templates
//   src/pages/shared/constants.ts — REVEAL, PAGE_REVEAL, PageId, SectionId
//   src/pages/shared/footer.ts   — FOOTER
//
// This shim re-exports the public API so existing imports
// (router.ts, entry-app.ts) continue to work without changes.
// New code should import directly from src/pages/.

export { renderPage, homePage, type PageId, type SectionId } from './pages'
