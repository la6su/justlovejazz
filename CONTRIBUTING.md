# Contributing to JUSTLOVEJAZZ

## Start

```bash
git clone https://github.com/la6su/justlovejazz.git
cd justlovejazz
bun install
bun run dev
```

Choose an open outcome from [NEXT.md](NEXT.md) or discuss a new one in an
issue. [AGENTS.md](AGENTS.md) gives the compact project context;
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) explains the non-obvious runtime
boundaries.

## Change

Work on a focused branch and follow the style and ownership already present in
the affected code. Keep the user-visible result coherent across DOM, scene and
route state. UI work can use the
[project UI skill](skills/justlovejazz-ui/SKILL.md).

Run focused checks while iterating and the gate in
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) before a pull request. Use a
[Conventional Commit](https://www.conventionalcommits.org/) and describe the
result and verification in the PR.

## Report an issue

Include the observed behavior, a reproducible path, expected behavior and the
relevant browser/device/renderer context. Screenshots or recordings are the
best reference for visual defects.

Contributions use the repository's [ISC license](LICENSE).
