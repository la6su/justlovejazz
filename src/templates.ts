// src/templates.ts — Backward-compat shim.
//
// All page templates reorganized into src/pages/ + src/sections/.
// This shim re-exports the public API so existing imports work unchanged.

export { renderPage, homePage, type PageId } from './pages'
