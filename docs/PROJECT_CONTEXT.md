# Project Context

## Product

**Justimania Mountain Edition** is a portrait-only, mobile-first vertical platformer. Justyna continuously ascends by automatically bouncing from platform to platform while the player steers horizontally. The mountain/hiking presentation and real-mountain checkpoints will turn height into a journey; in-game pixels will not claim a literal metre scale.

## Technical architecture

- Phaser 3, JavaScript, Vite, HTML/CSS, and npm only.
- `BootScene → MenuScene → GameScene` is the current flow.
- `GameScene` composes a player, platform manager, and independent background manager. This keeps future endless platforms and parallax/biome layers replaceable independently.
- Mobile input uses holdable left/right screen zones; Arrow keys and A/D support desktop development. There is no jump input.
- The camera records its highest upward progress rather than following the player back down.
- The manifest requests `portrait-primary`; a runtime viewport guard blocks input and pauses physics in landscape, then restores both in portrait. Orientation locking is only a graceful optional enhancement.
- Production targets GitHub Pages at `/justimania-mountain-edition/` using Vite's matching base and Actions artifacts.

## Future systems

Real mountains will be ordered by researched elevations but mapped to sensible gameplay spacing. Signs, height scoring, locally stored high score, endless platform generation, difficulty, animated Justyna sprites, and layered mountain biomes are intentionally later work. Visual files belong under `public/assets`; code must refer to stable asset paths rather than embedding art into gameplay modules.

## Current non-goals

No final art or animation, final mountain list/research, milestone implementation, procedural endless course, final balance, enemies, power-ups, audio, backend, monetization, analytics, or framework layer.

## Safe extension rules

Prefer narrow managers/modules with explicit ownership. Replace placeholders behind their existing boundaries. Keep collision geometry independent from art. Update canonical docs whenever a task explicitly changes a frozen contract, and avoid unrelated refactoring or dependencies.

## DO NOT BREAK

- GitHub Pages subpath deployment.
- Portrait orientation guard and graceful recovery.
- Holdable mobile left/right controls and desktop equivalents.
- Automatic bounce with no jump button.
- Upward-progression and non-descending camera architecture.
- Separation of visual assets, backgrounds, platform generation, and gameplay logic.

## Reference-repository findings

The requested reference repositories (`tamagotchi-jam` and `Gridfall-Tactics`) could not be fetched in this execution environment: direct GitHub access returned HTTP 403 and the search service was unavailable. No code or game logic was copied. This foundation nevertheless applies the requested reference goals—Pages via Actions, mobile-first layout, separated assets/gameplay, canonical docs, CI builds, and incremental workflow—and the comparison should be revisited when access is available.
