# Asset Contract

## Manual binary ownership

All binary game art and audio are supplied manually by the user. Codex must not generate, redraw, convert, optimize, resize, trim, normalize, overwrite, re-encode, or commit replacement binary files. Runtime scaling, positioning, frame selection, NineSlice rendering, and audio playback do not modify source files. Missing files must fall back safely without preventing boot.

## Canonical paths

These paths and filenames are frozen:

- `public/assets/backgrounds/menu-bg.webp`
- `public/assets/backgrounds/game-sky.webp`
- `public/assets/backgrounds/game-mountains-far.webp`
- `public/assets/backgrounds/game-mountains-mid.webp`
- `public/assets/player/justyna-sheet.png`
- `public/assets/platforms/platform-rock.png`
- `public/assets/ui/checkpoint-sign.png`
- `public/assets/ui/menu-justyna-kaya.png` (asset key: `menu-justyna-kaya`)
- `public/assets/ui/kaya-the-dog.png`
- `public/assets/audio/game-theme.mp3` (asset key: `game-theme`)

## Edition presentation contract

The stable edition IDs are `mountain` and `beach`. Runtime presentation is selected from
`src/config/editions.js`; gameplay systems and the `MenuScene` / `GameScene` implementations
remain shared. The application flow is `BootScene → EditionSelectScene → MenuScene → GameScene`.

Mountain continues to map to the frozen paths above: `menu-bg.webp`,
`menu-justyna-kaya.png`, shared `game-sky.webp`, `game-mountains-far.webp`,
`game-mountains-mid.webp`, and `platform-rock.png`.

Beach intentionally shares `public/assets/backgrounds/game-sky.webp`. The following future
manual binary slots are declared but are **not supplied by this repository change**:

- `public/assets/backgrounds/menu-beach-bg.webp`
- `public/assets/ui/menu-beach-justyna-kaya.png`
- `public/assets/backgrounds/beach-mountains-far.webp`
- `public/assets/backgrounds/beach-mountains-mid.webp`
- `public/assets/platforms/platform-beach.png`

Beach FAR owns the hazy sea horizon, distant low-contrast ocean, and subtle ship, sailboat,
or ferry silhouettes; it must avoid large objects and platform-like shapes. Beach MID owns
the nearer coast, beach, dunes and grasses, with optional subtle cliff, breakwater, or
lighthouse detail. It may be stronger than FAR but must keep the central gameplay corridor
readable and free of platform-like silhouettes. Ships belong primarily in FAR.

Until those binaries are manually supplied, the Beach menu uses a clean dark background,
edition title, and working START control with no foreground. Beach gameplay uses the shared
sky, omits unavailable FAR/MID layers, keeps the current player, and falls back to the
validated rock platform. Missing optional files are loader errors only and never block a
scene. When files appear at the canonical paths, they are loaded and used automatically.

Normal load and all MENU reloads return to `EditionSelectScene`. Victory PLAY AGAIN writes
the selected edition plus autostart intent to `sessionStorage`, reloads, then Boot consumes
and immediately removes that one-shot record before starting a fresh `GameScene`. Thus a
later manual refresh cannot unexpectedly autostart. No `localStorage` persistence is used.

## Gameplay music

`game-theme.mp3` is user-owned binary content and is loaded through Phaser's normal boot preload. It is gameplay-only: each `GameScene` owns one looping sound at the centralized default volume `0.32`; there is no menu music. Game Over and victory leave that same instance playing without restarting it. Scene shutdown stops and destroys it, so restart and menu-return transitions cannot retain an orphaned copy. A missing or failed audio load is non-fatal and gameplay continues silently.

## Justyna sprite sheet

`justyna-sheet.png` is 1536 × 1536, arranged as a 2 × 2 sheet of 768 × 768 frames loaded with `frameWidth: 768` and `frameHeight: 768`.

| Frame | Position | State |
| --- | --- | --- |
| 0 | top-left | `idle` |
| 1 | top-right | `jump` |
| 2 | bottom-left | `fall` |
| 3 | bottom-right | `land` |

Frames are selected from motion state rather than played as a sequence. Horizontal facing uses Phaser `flipX`. All frames must share aligned feet. A normalized Arcade body remains independent of the full transparent frame and stable between states.

## Runtime visual rules

- `menu-justyna-kaya.png` is a user-owned transparent PNG rendered directly as a separate, non-interactive menu foreground layer; Codex must never create, crop, resize, optimize, convert, re-encode, overwrite, or supply a placeholder for it. If it is absent, the title/reveal/START state flow continues without it.
- The menu duo preserves its source aspect ratio with one uniform runtime scale, targeting 330 logical px tall at x 290 and 24 px above the bottom safe edge (with edge-fit clamping when required). On the first tap it fades in and moves upward 22 px over 420 ms with `Quad.easeOut`; reduced motion completes in 1 ms alongside the existing reduced subtitle reveal. Its depth is background (`0`) < duo (`10`) < title/subtitle (`20`) < START visual/hit target (`30/31`). Final placement, transparency, silhouette visibility, and title/control clearance require validation with the supplied binary on a physical portrait phone.

- Background render order is sky, far mountains, mid mountains, then gameplay objects. The sky continuously covers the viewport behind every other layer.
- The far and mid mountain WebPs are non-seamless compositions and must not be vertically repeated with `TileSprite`. `BackgroundManager` owns paired, oversized, overlapping image instances for each mountain depth and crossfades controlled compositions as the camera ascends.
- Sky, far mountains, and mid mountains retain distinct, explicit parallax rates. Their runtime scale, positioning, overlap, and crossfade never modify the source binary artwork. Exact transition continuity must be validated on a portrait device.
- `platform-rock.png` is scaled to gameplay widths at runtime with NineSlice: decorative end caps stay intact while the center scales. No resized derivatives are permitted. Visual and collision widths must agree, while collision height remains separately defined around the landing surface.
- Until the user-supplied platform artwork is available for inspection, NineSlice boundaries are explicitly provisional source-relative values: 18% left cap, 18% right cap, 22% top slice, and 22% bottom slice. They must be visually validated and tuned against the real asset on a portrait device; the implementation makes no claim of visual correctness before that validation.
- `checkpoint-sign.png` contains no baked mountain text. Mountain name/elevation are rendered at runtime as centered, high-contrast Phaser text so content can be localized later. The explicit text anchor, offset, font sizes, and line spacing are provisional mobile-tuned values that target the visible wooden arrow face rather than the full decorative image bounds.
- `kaya-the-dog.png` is a user-owned horizontal 3-column, 1-row sheet. Its source width must divide evenly by three; runtime code discovers the loaded dimensions, registers equal frames, and loops `0 → 1 → 2 → 1` at 7 fps. The binary must never be created, cropped, resized, optimized, re-encoded, or overwritten by Codex. A missing or invalid sheet simply omits Kaya.
- Checkpoint signs and Kaya are depth-layered decoration only. They never receive Arcade bodies, colliders, overlap handlers, or other world interaction.
- Checkpoint signs preserve the supplied 1166:1349 aspect at 122 × 142 logical pixels. Runtime sign text uses an 11 px mountain name (9 px for long names), a 9 px elevation, and tight spacing without changing the sign scale. Kaya retains an 84 px target height. The explicit world-depth contract is backgrounds (`-20…-16`) < checkpoint decoration (`-5`) < Justyna (`0`) < HUD (`20`).
- Successfully loaded canonical art always takes priority over placeholders.
