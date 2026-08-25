# Justimania Mountain Edition

A mobile-first portrait browser platformer foundation in which Justyna automatically bounces between hiking-themed platforms and climbs toward future real-mountain milestones. This bootstrap deliberately uses placeholder graphics while gameplay, camera, input, asset, and deployment contracts settle.

## Status

Technical playground: menu, automatic bounce, keyboard/touch steering, upward-only camera, fall/restart flow, portrait guard, and layer-based endless bootstrap generation are implemented. Generator V2 guarantees a tested route, filters ceiling-like overlap, and uses a full-width starting floor. Final balancing and milestone gameplay are not implemented.

## Local development

```bash
npm install
npm run dev
npm run build
```

The production build uses the `/justimania-mountain-edition/` base and is deployed from `main` through GitHub Actions to [the expected GitHub Pages URL](https://lukaszpeciak91-sys.github.io/justimania-mountain-edition/). Repository Pages settings must use **GitHub Actions** as the source. Current graphics are placeholders.

Authoritative product and engineering contracts live in [`docs/`](docs/PROJECT_CONTEXT.md).
