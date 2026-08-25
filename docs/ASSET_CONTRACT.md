# Asset Contract

## Manual binary ownership

All binary game art is supplied manually by the user. Codex must not generate, redraw, convert, optimize, resize, overwrite, re-encode, or commit replacement PNG/WebP files. Runtime scaling, positioning, frame selection, and NineSlice rendering do not modify source files. Missing files must fall back to code-drawn primitives without preventing boot.

## Canonical paths

These paths and filenames are frozen:

- `public/assets/backgrounds/menu-bg.webp`
- `public/assets/backgrounds/game-sky.webp`
- `public/assets/backgrounds/game-mountains-far.webp`
- `public/assets/backgrounds/game-mountains-mid.webp`
- `public/assets/player/justyna-sheet.png`
- `public/assets/platforms/platform-rock.png`
- `public/assets/ui/checkpoint-sign.png`
- `public/assets/ui/kaya-the-dog.png`

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

- Background render order is sky, far mountains, mid mountains, then gameplay objects. The sky continuously covers the viewport behind every other layer.
- The far and mid mountain WebPs are non-seamless compositions and must not be vertically repeated with `TileSprite`. `BackgroundManager` owns paired, oversized, overlapping image instances for each mountain depth and crossfades controlled compositions as the camera ascends.
- Sky, far mountains, and mid mountains retain distinct, explicit parallax rates. Their runtime scale, positioning, overlap, and crossfade never modify the source binary artwork. Exact transition continuity must be validated on a portrait device.
- `platform-rock.png` is scaled to gameplay widths at runtime with NineSlice: decorative end caps stay intact while the center scales. No resized derivatives are permitted. Visual and collision widths must agree, while collision height remains separately defined around the landing surface.
- Until the user-supplied platform artwork is available for inspection, NineSlice boundaries are explicitly provisional source-relative values: 18% left cap, 18% right cap, 22% top slice, and 22% bottom slice. They must be visually validated and tuned against the real asset on a portrait device; the implementation makes no claim of visual correctness before that validation.
- `checkpoint-sign.png` contains no baked mountain text. Mountain name/elevation are centered, high-contrast Phaser text so content can be localized later.
- `kaya-the-dog.png` is a user-owned horizontal 3-column, 1-row sheet. Its source width must divide evenly by three; runtime code discovers the loaded dimensions, registers equal frames, and loops `0 → 1 → 2 → 1` at 7 fps. The binary must never be created, cropped, resized, optimized, re-encoded, or overwritten by Codex. A missing or invalid sheet simply omits Kaya.
- Checkpoint signs and Kaya are depth-layered decoration only. They never receive Arcade bodies, colliders, overlap handlers, or other world interaction.
- Checkpoint signs preserve the supplied 1166:1349 aspect at 102 × 118 logical pixels with 16 px text, or a controlled 14 px wrapped fallback for genuinely long names. Kaya retains a 70 px target height. The explicit world-depth contract is backgrounds (`-20…-16`) < checkpoint decoration (`-5`) < Justyna (`0`) < HUD (`20`).
- Successfully loaded canonical art always takes priority over placeholders.
