# JUSTLOVEJAZZ

EN/RU portfolio of technology and design solutions for business, combining
creative direction, automation, performance and distinctive visual craft.
Shared 3D scene, case studies, standalone blog and development-only page builder;
Vue 3, Vue Router, TresJS, Three.js TSL, UIkit Less, Vite and Bun.

```bash
bun install
bun run dev
```

SPA: `/`, `/services`, `/works`, `/works/:projectId`, `/manifesto`, `/lab`,
`/contact`. Static HTML: `/blog`, `/blog/<slug>`, approved `/p/<slug>` and
`/p/<slug>/ru`. Dev editor: `/admin/`. Works media includes labelled placeholders;
contact form delivery is not connected.

- [Agent instructions](AGENTS.md) · [Open work](NEXT.md)
- [Architecture](docs/ARCHITECTURE.md) · [Development/checks](docs/DEVELOPMENT.md)
- [Brand/theme](docs/BRAND.md) · [Page builder](docs/PAGE_BUILDER.md)
- [Inspection log](docs/INSPECTION.md) · [Evidence and measurement](docs/evidence/README.md) · [ISC license](LICENSE)

History is in Git. Migration plans, old ADR narratives and logs were removed
from active docs; their last full snapshot is
`ac3404d371011bfe533152ab2578a45dc5d5c978`. Retrieve a specific file only if needed:
`git show <commit>:<path>`. The exception is [docs/adr/0005](docs/adr/0005-tres-native-demand-loop.md) —
a decision made after that snapshot; prose references to "ADR 0004"/"ADR 0007"
resolve to `docs/adr/0004-preserve-demand-rendering.md` and
`docs/adr/0007-unify-brand-token-system.md` in the snapshot.
