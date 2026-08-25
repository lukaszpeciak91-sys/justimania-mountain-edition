# Project Context

## Product

**Justimania Mountain Edition** is a portrait-only, mobile-first vertical platformer. Justyna automatically bounces while the player steers horizontally. Height becomes a non-descending gameplay ascent score; it is not a literal metre scale.

## Implemented architecture

- Phaser 3, JavaScript, Vite, HTML/CSS, and npm only, with `BootScene → MenuScene → GameScene`.
- `BootScene` preloads every canonical manually supplied asset and reports development-only failures. Every consumer prefers loaded art and has a primitive fallback.
- `GameScene` composes `Player`, `PlatformManager`, `BackgroundManager`, `AscentTracker`, and `CheckpointManager` with separate ownership.
- Justyna uses four state frames, runtime horizontal flipping, a stable normalized collision body, and unchanged automatic bounce.
- The platform manager procedurally fills ahead of the ascending camera and prunes below it. Art uses runtime NineSlice widths independently from landing collision geometry.
- The background manager keeps the sky covering the viewport and owns paired, overlapping compositions for the non-seamless far/mid mountain artwork. It positions and crossfades those oversized images during ascent instead of vertically `TileSprite`-repeating them, while retaining distinct sky/far/mid parallax factors. Source artwork remains unchanged, and exact continuity requires portrait-device validation. Menu background drift is isolated from fixed UI.
- The menu presents the Bungee display face above a contrasting coral-red, italic Barlow Condensed “Mountain Edition” lockup. A first background tap reveals that subtitle left-to-right over 650 ms; only after it completes does START fade upward and accept a separate tap. Both faces are loaded from Google Fonts with explicit local fallback stacks, and reduced-motion preferences shorten the sequence.
- START and TAP TO RESTART share a compact rounded forest-green button treatment with coral outline, warm-cream Barlow Condensed labels, and the same restrained press response; their dimensions remain appropriate to their respective menu and Game Over contexts.
- Checkpoint model data is separate from dynamic sign rendering; the final researched milestone list is intentionally empty.
- Holdable left/right screen zones plus Arrow/A/D controls, world-edge wrapping, game-over/restart, and upward-only camera behavior remain intact.
- The manifest requests `portrait-primary`; a runtime viewport guard blocks input and pauses physics in landscape, then recovers in portrait.
- Production targets GitHub Pages at `/justimania-mountain-edition/`.

## Current non-goals

No user-owned binary generation or modification, final mountain list/research, final balance/polish, enemies, power-ups, audio, backend, monetization, analytics, or framework layer.

## DO NOT BREAK

- GitHub Pages subpath deployment.
- Portrait orientation guard and graceful recovery.
- Holdable mobile left/right controls and desktop equivalents.
- Automatic bounce with no jump button.
- Upward-only camera, maximum-ascent scoring, and legitimate fall game-over.
- Separation of assets, backgrounds, platform generation, checkpoints, and gameplay logic.
