# Refactor Worklog

---
Task ID: 1
Agent: main
Task: Create refactor branch, analyze broken features, plan fixes

Work Log:
- Read audit report (docs/AUDIT-FULL.md) — 4-phase refactoring plan
- Analyzed all broken features: showreel, home works slider, works page
- Root cause: CasePlane uses module-level shared material/uniforms/texture
  - ALL 12 BakuCarousel cards share ONE MeshBasicNodeMaterial
  - Only last card's texture + uniform values render for ALL cards
  - This breaks the carousel where 3+ cards are visible simultaneously
- Identified duplicate transition code in BakuCarousel.beginFullscreenTransition vs WorksPlaneStage.openProject
- Showreel has no transition at all — just UIKit modal popup
- Created branch refactor/unified-transition-fixes

Stage Summary:
- Branch created, root causes identified
- Plan: fix CasePlane per-instance materials, unify transition, fix showreel, verify slidenav