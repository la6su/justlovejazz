# Next work

This is the current execution plan. Work from top to bottom unless new evidence
changes the order. Each item describes an outcome rather than an implementation.

## 1 — Protect the current experience

- [ ] **Mobile accessibility pass** — bring story navigation and configuration
      controls to reliable touch-target sizes, improve sub-12px functional
      text, keep the mobile brand legible inside the CRT frame, and verify
      keyboard, focus, both theme polarities and reduced motion.

- [ ] **Route-runtime regression coverage** — cover Lab/home object visibility,
      repeated route changes, lazy initialization and teardown races; add
      representative WebGPU/WebGL2 assertions where automation is reliable and
      retain real-hardware parity checks for canvas output.

- [ ] **Make CI and direct-route deployment deterministic** — run formatting in
      CI, replace the undeclared `npx wait-on` fetch with a pinned Bun-owned
      mechanism, remove recurring UIkit form-asset build warnings, verify
      production rewrites for every sitemap route, and make Lighthouse results
      actionable rather than warning-only.

## 2 — Strengthen the product

- [ ] **Turn Works into evidence** — replace atmospheric placeholder cases with
      approved projects that state the problem, response, role and proof; align
      case imagery, detail overlays, blog articles and metadata around the same
      facts.

- [ ] **Replace placeholder media and contact flow** — ship an approved,
      delivery-conscious showreel and a contact path that reliably captures a
      visitor's reply address and project context without depending on a
      subject-only `mailto:` form.

- [ ] **Define the Lab experiment boundary** — finish the gamepad route slice,
      define a small experiment manifest and load each accepted experiment
      behind its own scene boundary so the shared startup bundle stays stable.
      Fold the remaining stale bootstrap/UIkit comments in the pending
      `Experience.ts` change into that slice.

## 3 — Refine after evidence

- [ ] **UIkit and CSS consolidation** — measure active component, utility and
      selector use; remove proven duplication while retaining the authored 3D
      shell, cinematic composition and accessibility behavior.

- [ ] **Cross-backend performance budget** — profile representative routes on
      WebGPU and WebGL2 at desktop/mobile DPRs, protect the ≤350 KB gzip Three.js
      budget, inspect the 15.6 MB media path and record real idle-frame evidence
      before tuning materials or delivery.

- [ ] **Shared transition language** — prototype one route/Menu/project
      transition after the baseline, accessibility and performance evidence are
      stable; include low-tier, blog and reduced-motion handoffs in the same
      acceptance criteria.

## Plan maintenance

After completing an item, update this file in the same change: remove the
completed outcome, incorporate discovered follow-up work, and reorder the
remaining items when evidence changes their priority.
